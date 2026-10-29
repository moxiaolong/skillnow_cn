const ALLOWED_ORIGINS = new Set([
  "https://skillnow.cn",
  "https://www.skillnow.cn",
]);

const MAX_IDS = 50;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function allowedOrigin(request) {
  const origin = request.headers.get("Origin") || "";
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  if (/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.edgeone\.(app|site)$/i.test(origin)) {
    return origin;
  }
  if (/^http:\/\/localhost(:\d+)?$/i.test(origin)) return origin;
  return null;
}

function corsHeaders(request) {
  const origin = allowedOrigin(request);
  if (!origin) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "Origin",
  };
}

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("eo-connecting-ip") ||
    request.headers.get("true-client-ip") ||
    request.headers.get("x-real-ip") ||
    "0.0.0.0"
  );
}

function todayInShanghai() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  return hex(signature);
}

function kvFromEnv(env) {
  return env.REACTIONS_KV || null;
}

async function readCount(kv, key) {
  const value = await kv.get(key);
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function parseIds(url) {
  const raw = url.searchParams.get("ids") || "";
  return [...new Set(raw.split(",").map((id) => id.trim()))]
    .filter((id) => SLUG_PATTERN.test(id))
    .slice(0, MAX_IDS);
}

async function handleGet(request, env) {
  const kv = kvFromEnv(env);
  const ids = parseIds(new URL(request.url));

  if (ids.length === 0) {
    return json({ counts: {} }, 200, corsHeaders(request));
  }

  if (!kv) {
    return json(
      { counts: {}, error: "kv_unavailable" },
      503,
      corsHeaders(request),
    );
  }

  const counts = {};
  await Promise.all(
    ids.map(async (id) => {
      const [up, down] = await Promise.all([
        readCount(kv, `c:${id}:up`),
        readCount(kv, `c:${id}:down`),
      ]);
      counts[id] = { up, down };
    }),
  );

  return json({ counts }, 200, corsHeaders(request));
}

async function handlePost(request, env) {
  const cors = corsHeaders(request);
  if (!allowedOrigin(request)) {
    return json({ ok: false, reason: "origin_not_allowed" }, 403, cors);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, reason: "invalid_json" }, 400, cors);
  }

  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const action = body?.action;

  if (!SLUG_PATTERN.test(slug)) {
    return json({ ok: false, reason: "invalid_slug" }, 400, cors);
  }
  if (action !== "up" && action !== "down") {
    return json({ ok: false, reason: "invalid_action" }, 400, cors);
  }

  const kv = kvFromEnv(env);
  if (!kv) {
    return json({ ok: false, reason: "kv_unavailable" }, 503, cors);
  }

  const secret = env.REACTIONS_HMAC_SECRET;
  if (!secret) {
    return json({ ok: false, reason: "server_misconfigured" }, 503, cors);
  }

  const date = todayInShanghai();
  const voterHash = await hmacHex(
    secret,
    `${getClientIp(request)}|${request.headers.get("user-agent") || ""}|${slug}|${date}`,
  );
  const voterKey = `v:${date}:${voterHash}:${slug}`;

  if (await kv.get(voterKey)) {
    const [up, down] = await Promise.all([
      readCount(kv, `c:${slug}:up`),
      readCount(kv, `c:${slug}:down`),
    ]);
    return json(
      { ok: false, reason: "already_voted", counts: { up, down } },
      409,
      cors,
    );
  }

  const upKey = `c:${slug}:up`;
  const downKey = `c:${slug}:down`;
  const [up, down] = await Promise.all([
    readCount(kv, upKey),
    readCount(kv, downKey),
  ]);

  const nextUp = action === "up" ? up + 1 : up;
  const nextDown = action === "down" ? down + 1 : down;

  await Promise.all([
    kv.put(upKey, String(nextUp)),
    kv.put(downKey, String(nextDown)),
    kv.put(voterKey, "1"),
  ]);

  return json(
    { ok: true, counts: { up: nextUp, down: nextDown } },
    200,
    cors,
  );
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    if (method === "GET") {
      return await handleGet(request, env);
    }
    if (method === "POST") {
      return await handlePost(request, env);
    }
    return json(
      { ok: false, reason: "method_not_allowed" },
      405,
      corsHeaders(request),
    );
  } catch (error) {
    console.error("reactions error", error);
    return json(
      { ok: false, reason: "server_error" },
      500,
      corsHeaders(request),
    );
  }
}
