const { dashboard, isAuthorized, sendJson } = require("./_lib/crm-store");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 200, { ok: true });
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed." });
  if (!isAuthorized(req)) return sendJson(res, 401, { error: "Unauthorized." });

  try {
    return sendJson(res, 200, await dashboard());
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Unexpected dashboard API error." });
  }
};
