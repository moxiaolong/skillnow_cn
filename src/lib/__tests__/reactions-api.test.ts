import { describe, expect, it } from "vitest";

import { onRequest } from "../../../functions/api/reactions.js";

function createKv() {
  const store = new Map<string, string>();
  return {
    store,
    kv: {
      get: async (key: string) => store.get(key),
      put: async (key: string, value: string) => {
        store.set(key, value);
      },
    },
  };
}

function makeRequest(
  method: "GET" | "POST",
  body?: Record<string, unknown>,
  origin = "https://skillnow.cn",
) {
  return new Request("https://skillnow.cn/api/reactions", {
    method,
    headers: {
      origin,
      "content-type": "application/json",
      "user-agent": "vitest",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeContext(kv: ReturnType<typeof createKv>["kv"], request: Request) {
  return {
    request,
    env: {
      REACTIONS_KV: kv,
      REACTIONS_HMAC_SECRET: "test-secret",
    },
  };
}

describe("GET /api/reactions", () => {
  it("returns zero counts for known ids", async () => {
    const { kv } = createKv();
    const request = new Request(
      "https://skillnow.cn/api/reactions?ids=sigmund-freud,hegel",
      { headers: { origin: "https://skillnow.cn" } },
    );
    const response = await onRequest(makeContext(kv, request));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.counts["sigmund-freud"]).toEqual({ up: 0, down: 0 });
    expect(data.counts.hegel).toEqual({ up: 0, down: 0 });
  });

  it("ignores invalid ids", async () => {
    const { kv } = createKv();
    const request = new Request(
      "https://skillnow.cn/api/reactions?ids=../etc,<script>",
      { headers: { origin: "https://skillnow.cn" } },
    );
    const response = await onRequest(makeContext(kv, request));
    const data = await response.json();

    expect(data.counts).toEqual({});
  });
});

describe("POST /api/reactions", () => {
  it("accepts one vote per day and rejects the second", async () => {
    const { kv, store } = createKv();
    const first = await onRequest(
      makeContext(kv, makeRequest("POST", { slug: "sigmund-freud", action: "up" })),
    );
    const firstData = await first.json();

    expect(first.status).toBe(200);
    expect(firstData.ok).toBe(true);
    expect(firstData.counts).toEqual({ up: 1, down: 0 });
    expect([...store.keys()].some((key) => key.startsWith("v:"))).toBe(true);

    const second = await onRequest(
      makeContext(
        kv,
        makeRequest("POST", { slug: "sigmund-freud", action: "down" }),
      ),
    );
    const secondData = await second.json();

    expect(second.status).toBe(409);
    expect(secondData.ok).toBe(false);
    expect(secondData.reason).toBe("already_voted");
    expect(secondData.counts).toEqual({ up: 1, down: 0 });
  });

  it("rejects invalid slugs and actions", async () => {
    const { kv } = createKv();

    const badSlug = await onRequest(
      makeContext(kv, makeRequest("POST", { slug: "../x", action: "up" })),
    );
    expect(badSlug.status).toBe(400);

    const badAction = await onRequest(
      makeContext(kv, makeRequest("POST", { slug: "hegel", action: "meh" })),
    );
    expect(badAction.status).toBe(400);
  });

  it("rejects disallowed origins", async () => {
    const { kv } = createKv();
    const response = await onRequest(
      makeContext(
        kv,
        makeRequest("POST", { slug: "hegel", action: "up" }, "https://evil.example"),
      ),
    );

    expect(response.status).toBe(403);
  });

  it("allows localhost origin for local testing", async () => {
    const { kv } = createKv();
    const response = await onRequest(
      makeContext(
        kv,
        makeRequest("POST", { slug: "hegel", action: "up" }, "http://localhost:3000"),
      ),
    );

    expect(response.status).toBe(200);
  });
});
