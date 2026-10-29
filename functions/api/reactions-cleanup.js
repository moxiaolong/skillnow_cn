function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function dateInShanghai(daysAgo = 0) {
  return new Date(Date.now() + 8 * 60 * 60 * 1000 - daysAgo * 86400000)
    .toISOString()
    .slice(0, 10);
}

function listNames(result) {
  const keys = Array.isArray(result) ? result : result?.keys || [];
  return keys
    .map((entry) => (typeof entry === "string" ? entry : entry?.name))
    .filter((name) => typeof name === "string" && name.length > 0);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method.toUpperCase() !== "POST") {
    return json({ ok: false, reason: "method_not_allowed" }, 405);
  }

  const expected = env.REACTIONS_CLEANUP_SECRET;
  const provided = request.headers.get("x-cleanup-secret");

  if (!expected || !provided || provided !== expected) {
    return json({ ok: false, reason: "forbidden" }, 403);
  }

  const kv = env.REACTIONS_KV;
  if (!kv) {
    return json({ ok: false, reason: "kv_unavailable" }, 503);
  }

  if (typeof kv.list !== "function" || typeof kv.delete !== "function") {
    return json({ ok: false, reason: "kv_list_unsupported" }, 501);
  }

  const cutoff = dateInShanghai(2);

  try {
    const listed = await kv.list({ prefix: "v:" });
    const names = listNames(listed);
    const oldKeys = names.filter((name) => {
      const date = name.slice(2, 12);
      return /^\d{4}-\d{2}-\d{2}$/.test(date) && date < cutoff;
    });

    await Promise.all(oldKeys.map((name) => kv.delete(name)));

    return json({ ok: true, deleted: oldKeys.length, cutoff });
  } catch (error) {
    console.error("reactions cleanup error", error);
    return json({ ok: false, reason: "server_error" }, 500);
  }
}
