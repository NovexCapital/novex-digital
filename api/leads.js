const { randomUUID } = require("node:crypto");

const MAX_LEADS = 500;

function json(res, status, response) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type,x-novex-token");
  res.end(JSON.stringify(response));
}

function redisUrl() {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
}

function redisToken() {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
}

function requiredEnv() {
  return redisUrl() && redisToken();
}

async function redis(command) {
  const response = await fetch(`${redisUrl()}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${redisToken()}`,
      "content-type": "application/json"
    },
    body: JSON.stringify([command])
  });

  if (!response.ok) throw new Error(`Redis request failed: ${response.status}`);
  const [result] = await response.json();
  if (result.error) throw new Error(result.error);
  return result.result;
}

function normalizeLead(input) {
  const now = new Date().toISOString();
  const name = input.name || input.full_name || input.customer || input["Your name"] || input.Name || "Unnamed lead";
  const phone = input.phone || input.mobile || input.tel || input.whatsapp || input["WhatsApp number"] || input.Phone || "";
  const business = input.business || input["Business name"] || input.Business || "";
  const updatedAt = input.updatedAt || input.updated_at || input.createdAt || input.created_at || input.Timestamp || input.timestamp || now;

  return {
    id: String(input.id || input.ID || `${name}-${phone}-${updatedAt}`),
    name: String(name),
    phone: String(phone),
    business: String(business),
    source: String(input.source || input.channel || "Novex Digital Website"),
    value: Number(input.value || input.amount || 0),
    notes: String(input.notes || input.note || input.message || input.automation || input["What do you want to improve or automate?"] || ""),
    status: String(input.status || "new").toLowerCase(),
    priority: String(input.priority || "normal").toLowerCase(),
    service: String(input.service || input["Service"] || ""),
    createdAt: input.createdAt || input.created_at || updatedAt,
    updatedAt
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body) {
      resolve(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
      return;
    }

    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      resolve(raw ? JSON.parse(raw) : {});
    });
    req.on("error", reject);
  });
}

async function readGoogleSheetLeads() {
  if (!process.env.GOOGLE_SHEETS_WEB_APP_URL) return [];

  const response = await fetch(process.env.GOOGLE_SHEETS_WEB_APP_URL, {
    headers: { accept: "application/json" }
  });

  if (!response.ok) return [];
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    const rows = Array.isArray(data) ? data : Array.isArray(data.leads) ? data.leads : Array.isArray(data.rows) ? data.rows : [];
    return rows.map(normalizeLead);
  } catch {
    return [];
  }
}

async function storeLeads(leads) {
  if (!leads.length) return;
  await redis(["LPUSH", "novex:leads", ...leads.map(lead => JSON.stringify(lead))]);
  await redis(["LTRIM", "novex:leads", 0, MAX_LEADS - 1]);
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 200, { ok: true });

  if (!requiredEnv()) {
    return json(res, 503, {
      error: "Lead storage is not configured.",
      setup: "Connect Upstash Redis to Vercel or add KV_REST_API_URL and KV_REST_API_TOKEN."
    });
  }

  try {
    if (req.method === "POST") {
      const expectedToken = process.env.NOVEX_WEBHOOK_TOKEN;
      if (expectedToken && req.headers["x-novex-token"] !== expectedToken) {
        return json(res, 401, { error: "Unauthorized webhook token." });
      }

      const body = await readBody(req);
      const entries = Array.isArray(body) ? body : Array.isArray(body.leads) ? body.leads : [body];
      const leads = entries.map(normalizeLead);
      await storeLeads(leads);
      return json(res, 200, { ok: true, received: leads.length, leads });
    }

    if (req.method === "GET") {
      const since = new URL(req.url, "https://novexdigital.co.za").searchParams.get("since");
      const rows = await redis(["LRANGE", "novex:leads", 0, MAX_LEADS - 1]);
      const redisLeads = rows.map(row => JSON.parse(row));
      const sheetLeads = await readGoogleSheetLeads();

      if (sheetLeads.length) await storeLeads(sheetLeads);

      const merged = new Map();
      [...redisLeads, ...sheetLeads].forEach(lead => merged.set(lead.id, lead));
      const leads = Array.from(merged.values()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const filtered = since ? leads.filter(lead => new Date(lead.updatedAt) > new Date(since)) : leads;
      return json(res, 200, { leads: filtered, sources: { redis: redisLeads.length, googleSheets: sheetLeads.length } });
    }

    return json(res, 405, { error: "Method not allowed." });
  } catch (error) {
    return json(res, 500, { error: error.message || "Unexpected lead API error." });
  }
};
