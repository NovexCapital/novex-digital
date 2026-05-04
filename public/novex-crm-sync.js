(() => {
  const originalFetch = window.fetch.bind(window);

  function isLeadCaptureUrl(input) {
    const url = typeof input === "string" ? input : input?.url || "";
    return url.includes("script.google.com/macros") && url.includes("/exec");
  }

  function parseLeadBody(body) {
    if (!body) return null;
    if (typeof body === "string") {
      try { return JSON.parse(body); } catch { return null; }
    }
    if (body instanceof FormData) {
      return Object.fromEntries(body.entries());
    }
    if (typeof body === "object") return body;
    return null;
  }

  window.fetch = function novexSyncedFetch(input, init = {}) {
    const method = String(init.method || "GET").toUpperCase();
    const lead = method === "POST" && isLeadCaptureUrl(input) ? parseLeadBody(init.body) : null;

    if (lead) {
      originalFetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...lead,
          source: lead.source || "Novex Digital Website",
          status: "new",
          priority: lead.service?.toLowerCase?.().includes("automation") ? "hot" : "normal",
          updatedAt: new Date().toISOString()
        })
      }).catch(() => {});
    }

    return originalFetch(input, init);
  };
})();
