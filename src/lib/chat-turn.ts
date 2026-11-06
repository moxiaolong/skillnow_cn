import {
  EMPTY_RESPONSE_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  SEARCH_NETWORK_ERROR_MESSAGE,
  createSseParser,
  extractCompletion,
  extractProviderError,
  isAbortError,
  mapHttpError,
  mapSearchHttpError,
  redactSecret,
  type CompletedToolCall,
  type RequestMessage,
} from "@/lib/chat-stream";
import {
  WEB_SEARCH_TOOL,
  buildSearchRequest,
  buildToolResult,
  mergeSearchResults,
  parseSearchResults,
  type ChatSource,
  type SearchResult,
} from "@/lib/chat-search";
import type { ReasoningEffort } from "@/lib/chat-settings";

export class ChatRequestError extends Error {
  readonly detail?: string;

  constructor(title: string, detail?: string) {
    super(title);
    this.name = "ChatRequestError";
    this.detail = detail;
  }
}

export type ChatRoundResult = {
  content: string;
  reasoning: string;
  toolCalls: CompletedToolCall[];
};

export function parseToolArguments(value: string): {
  query?: string;
  ori_question?: string;
} | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    return {
      ...(typeof record.query === "string" ? { query: record.query } : {}),
      ...(typeof record.ori_question === "string"
        ? { ori_question: record.ori_question }
        : {}),
    };
  } catch {
    return null;
  }
}

export async function requestChatRound(params: {
  endpoint: string;
  apiKey: string;
  model: string;
  reasoningEffort: ReasoningEffort;
  messages: RequestMessage[];
  toolsEnabled: boolean;
  controller: AbortController;
  onDelta: (content: string, reasoning: string) => void;
}): Promise<ChatRoundResult> {
  const body: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
    stream: true,
  };

  if (params.reasoningEffort !== "default") {
    body.reasoning_effort = params.reasoningEffort;
  }

  if (params.toolsEnabled) {
    body.tools = [WEB_SEARCH_TOOL];
    body.tool_choice = "auto";
  }

  const response = await fetch(params.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: params.controller.signal,
    referrerPolicy: "no-referrer",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const detail = extractProviderError(text, params.apiKey);
    throw new ChatRequestError(
      mapHttpError(response.status),
      detail ?? undefined,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  let content = "";
  let reasoning = "";
  const toolCalls = new Map<
    number,
    { id: string; name: string; arguments: string }
  >();
  const streamError: { message: string | null } = { message: null };

  if (!contentType.includes("text/event-stream") || !response.body) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new ChatRequestError("模型平台返回了无法解析的响应。");
    }

    const completion = extractCompletion(payload);
    params.onDelta(completion.content, completion.reasoning);
    return {
      content: completion.content,
      reasoning: completion.reasoning,
      toolCalls: completion.toolCalls,
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser((event) => {
    if (event.type === "delta") {
      if (event.content) content += event.content;
      if (event.reasoning) reasoning += event.reasoning;

      if (event.toolCalls) {
        for (const delta of event.toolCalls) {
          const current = toolCalls.get(delta.index) ?? {
            id: "",
            name: "",
            arguments: "",
          };
          if (delta.id) current.id = delta.id;
          if (delta.name) current.name = delta.name;
          if (delta.arguments) current.arguments += delta.arguments;
          toolCalls.set(delta.index, current);
        }
      }

      if (event.content || event.reasoning) {
        params.onDelta(content, reasoning);
      }
    } else if (event.type === "error") {
      streamError.message = event.message;
    }
  });

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.push(decoder.decode(value, { stream: true }));
  }
  parser.push(decoder.decode());
  parser.flush();

  if (streamError.message) {
    throw new ChatRequestError(
      "模型平台返回了错误。",
      redactSecret(streamError.message, params.apiKey),
    );
  }

  return {
    content,
    reasoning,
    toolCalls: [...toolCalls.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([index, call]) => ({
        id: call.id || `call_${index}`,
        name: call.name,
        arguments: call.arguments,
      }))
      .filter((call) => call.name.length > 0),
  };
}

export async function executeWebSearch(params: {
  endpoint: string;
  apiKey: string;
  query: string;
  oriQuestion?: string;
  signal: AbortSignal;
}): Promise<SearchResult[]> {
  const request = buildSearchRequest(params.query, params.oriQuestion);
  if (!request) return [];

  let response: Response;
  try {
    response = await fetch(params.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(request),
      signal: params.signal,
      referrerPolicy: "no-referrer",
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ChatRequestError("联网搜索失败", SEARCH_NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const detail = extractProviderError(text, params.apiKey);
    throw new ChatRequestError(
      "联网搜索失败",
      [mapSearchHttpError(response.status), detail].filter(Boolean).join(" "),
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ChatRequestError(
      "联网搜索失败",
      "搜索服务返回了无法解析的响应。",
    );
  }

  return parseSearchResults(payload);
}

export type ChatTurnResult = {
  content: string;
  reasoning: string;
  sources: ChatSource[];
};

export async function runChatTurn(params: {
  endpoint: string;
  apiKey: string;
  model: string;
  reasoningEffort: ReasoningEffort;
  messages: RequestMessage[];
  searchEnabled: boolean;
  searchEndpoint: string | null;
  controller: AbortController;
  onDelta: (content: string, reasoning: string, sources: ChatSource[]) => void;
  onSearching?: (searching: boolean) => void;
  isActive?: () => boolean;
  maxToolRounds?: number;
  maxSearchCalls?: number;
}): Promise<ChatTurnResult> {
  const maxToolRounds = params.maxToolRounds ?? 3;
  const maxSearchCalls = params.maxSearchCalls ?? 3;
  const isActive = () => params.isActive?.() ?? true;

  let allReasoning = "";
  let sources: ChatSource[] = [];
  let finalContent = "";
  let toolRounds = 0;
  let searchCalls = 0;

  while (isActive()) {
    const allowTools =
      params.searchEnabled &&
      Boolean(params.searchEndpoint) &&
      toolRounds < maxToolRounds &&
      searchCalls < maxSearchCalls;
    const reasoningBeforeRound = allReasoning;

    const round = await requestChatRound({
      endpoint: params.endpoint,
      apiKey: params.apiKey,
      model: params.model,
      reasoningEffort: params.reasoningEffort,
      messages: params.messages,
      toolsEnabled: allowTools,
      controller: params.controller,
      onDelta: (content, reasoning) => {
        if (!isActive()) return;
        const combinedReasoning = [reasoningBeforeRound, reasoning]
          .filter(Boolean)
          .join("\n\n");
        params.onDelta(content, combinedReasoning, sources);
      },
    });

    if (!isActive()) throw new DOMException("Aborted", "AbortError");

    allReasoning = [allReasoning, round.reasoning]
      .filter(Boolean)
      .join("\n\n");

    if (!allowTools || round.toolCalls.length === 0) {
      finalContent = round.content;
      params.onDelta(finalContent, allReasoning, sources);
      break;
    }

    params.onDelta("", allReasoning, sources);

    params.messages.push({
      role: "assistant",
      content: round.content || null,
      ...(round.reasoning ? { reasoning_content: round.reasoning } : {}),
      tool_calls: round.toolCalls.map((call) => ({
        id: call.id,
        type: "function" as const,
        function: {
          name: call.name,
          arguments: call.arguments,
        },
      })),
    });

    params.onSearching?.(true);

    for (const toolCall of round.toolCalls) {
      if (!isActive()) throw new DOMException("Aborted", "AbortError");

      if (toolCall.name !== "web_search") {
        params.messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: `未知工具：${toolCall.name}`,
          }),
        });
        continue;
      }

      const args = parseToolArguments(toolCall.arguments);
      if (!args?.query) {
        params.messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: "query 参数缺失或无效。",
          }),
        });
        continue;
      }

      if (searchCalls >= maxSearchCalls || !params.searchEndpoint) {
        params.messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: "搜索次数已达上限，请基于已有资料回答。",
          }),
        });
        continue;
      }

      const results = await executeWebSearch({
        endpoint: params.searchEndpoint,
        apiKey: params.apiKey,
        query: args.query,
        oriQuestion: args.ori_question,
        signal: params.controller.signal,
      });

      if (!isActive()) throw new DOMException("Aborted", "AbortError");

      searchCalls += 1;
      const merged = mergeSearchResults(sources, results);
      sources = merged.sources;
      params.onDelta("", allReasoning, sources);
      params.messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: buildToolResult(
          args.query,
          merged.added,
          merged.startIndex,
        ),
      });
    }

    params.onSearching?.(false);
    toolRounds += 1;
  }

  if (!finalContent.trim() && !allReasoning.trim()) {
    throw new ChatRequestError(EMPTY_RESPONSE_MESSAGE);
  }

  return { content: finalContent, reasoning: allReasoning, sources };
}

export async function requestChatText(params: {
  endpoint: string;
  apiKey: string;
  model: string;
  messages: RequestMessage[];
  controller: AbortController;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const body: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
    stream: false,
    max_tokens: params.maxTokens ?? 8,
    temperature: params.temperature ?? 0,
  };

  let response: Response;
  try {
    response = await fetch(params.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: params.controller.signal,
      referrerPolicy: "no-referrer",
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ChatRequestError("主持人判断失败", NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const detail = extractProviderError(text, params.apiKey);
    throw new ChatRequestError(
      "主持人判断失败",
      [mapHttpError(response.status), detail].filter(Boolean).join(" "),
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ChatRequestError(
      "主持人判断失败",
      "模型返回了无法解析的响应。",
    );
  }

  return extractCompletion(payload).content.trim();
}
