const { randomUUID } = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { parse: parseQuery } = require("node:querystring");

const COLLECTIONS = ["leads", "contacts", "deals", "tasks", "notes"];
const STORE_PREFIX = "novex:crm";
const MAX_RECORDS = 1000;
const FALLBACK_FILE = process.env.NOVEX_CRM_FILE || path.join(os.tmpdir(), "novex-crm-store.json");

function redisUrl() {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
}

function redisToken() {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
}

function hasRedis() {
  return Boolean(redisUrl() && redisToken());
}

function emptyStore() {
  return Object.fromEntries(COLLECTIONS.map((name) => [name, []]));
}

async function readFallbackStore() {
  try {
    const raw = await fs.readFile(FALLBACK_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return { ...emptyStore(), ...parsed };
  } catch {
    return emptyStore();
  }
}

async function writeFallbackStore(store) {
  await fs.mkdir(path.dirname(FALLBACK_FILE), { recursive: true });
  await fs.writeFile(FALLBACK_FILE, JSON.stringify(store, null, 2));
}

function collectionKey(collection) {
  return `${STORE_PREFIX}:${collection}`;
}

async function redisPipeline(commands) {
  const response = await fetch(`${redisUrl()}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${redisToken()}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(commands)
  });

  if (!response.ok) throw new Error(`Redis request failed with ${response.status}`);

  const results = await response.json();
  return results.map((item) => {
    if (item.error) throw new Error(item.error);
    return item.result;
  });
}

async function readCollection(collection) {
  if (!COLLECTIONS.includes(collection)) throw new Error(`Unknown CRM collection: ${collection}`);

  if (!hasRedis()) {
    const store = await readFallbackStore();
    return [...store[collection]];
  }

  const [raw] = await redisPipeline([["GET", collectionKey(collection)]]);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeCollection(collection, records) {
  const sorted = [...records]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, MAX_RECORDS);

  if (!hasRedis()) {
    const store = await readFallbackStore();
    store[collection] = sorted;
    await writeFallbackStore(store);
    return sorted;
  }

  await redisPipeline([["SET", collectionKey(collection), JSON.stringify(sorted)]]);
  return sorted;
}

function normalizeStatus(status, fallback = "new") {
  return String(status || fallback).trim().toLowerCase().replace(/\s+/g, "-");
}

function normalizeLead(input = {}) {
  const now = new Date().toISOString();
  const name = input.name || input.full_name || input.customer || input["Your name"] || input.Name || "Unnamed lead";
  const email = input.email || input.mail || input.Email || "";
  const phone = input.phone || input.mobile || input.tel || input.whatsapp || input.Phone || "";
  const message = input.message || input.notes || input.note || input.automation || input["What should the system improve?"] || "";

  return {
    id: String(input.id || input.ID || randomUUID()),
    name: String(name),
    email: String(email),
    phone: String(phone),
    company: String(input.company || input.business || input["Business name"] || input.Business || ""),
    source: String(input.source || input.channel || "Novex Digital Website"),
    service: String(input.service || input.Service || ""),
    value: Number(input.value || input.amount || 0),
    notes: String(message),
    status: normalizeStatus(input.status, "new"),
    priority: normalizeStatus(input.priority, "normal"),
    owner: String(input.owner || "Novex"),
    createdAt: input.createdAt || input.created_at || input.Timestamp || input.timestamp || now,
    updatedAt: input.updatedAt || input.updated_at || now
  };
}

function normalizeContact(input = {}) {
  const now = new Date().toISOString();
  return {
    id: String(input.id || randomUUID()),
    name: String(input.name || "Unnamed contact"),
    email: String(input.email || ""),
    phone: String(input.phone || input.whatsapp || ""),
    company: String(input.company || input.business || ""),
    role: String(input.role || ""),
    source: String(input.source || "CRM"),
    notes: String(input.notes || ""),
    status: normalizeStatus(input.status, "active"),
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now
  };
}

function normalizeDeal(input = {}) {
  const now = new Date().toISOString();
  return {
    id: String(input.id || randomUUID()),
    title: String(input.title || input.name || "Untitled deal"),
    contactId: String(input.contactId || input.contact_id || ""),
    leadId: String(input.leadId || input.lead_id || ""),
    company: String(input.company || input.business || ""),
    value: Number(input.value || input.amount || 0),
    stage: normalizeStatus(input.stage || input.status, "qualified"),
    probability: Number(input.probability || 25),
    closeDate: String(input.closeDate || input.close_date || ""),
    notes: String(input.notes || ""),
    owner: String(input.owner || "Novex"),
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now
  };
}

function normalizeTask(input = {}) {
  const now = new Date().toISOString();
  return {
    id: String(input.id || randomUUID()),
    title: String(input.title || input.name || "Follow up"),
    relatedType: String(input.relatedType || input.related_type || "lead"),
    relatedId: String(input.relatedId || input.related_id || input.leadId || ""),
    dueAt: String(input.dueAt || input.due_at || ""),
    priority: normalizeStatus(input.priority, "normal"),
    status: normalizeStatus(input.status, "open"),
    notes: String(input.notes || ""),
    owner: String(input.owner || "Novex"),
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now
  };
}

function normalizeNote(input = {}) {
  const now = new Date().toISOString();
  return {
    id: String(input.id || randomUUID()),
    relatedType: String(input.relatedType || input.related_type || "lead"),
    relatedId: String(input.relatedId || input.related_id || input.leadId || ""),
    body: String(input.body || input.notes || input.message || ""),
    author: String(input.author || "Novex"),
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now
  };
}

function normalizeRecord(collection, input) {
  const normalizers = {
    leads: normalizeLead,
    contacts: normalizeContact,
    deals: normalizeDeal,
    tasks: normalizeTask,
    notes: normalizeNote
  };
  return normalizers[collection](input);
}

function mergeRecord(existing, incoming) {
  return {
    ...existing,
    ...incoming,
    id: existing?.id || incoming.id || randomUUID(),
    createdAt: existing?.createdAt || incoming.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function upsertRecord(collection, input) {
  const records = await readCollection(collection);
  const normalized = normalizeRecord(collection, input);
  const index = records.findIndex((record) => record.id === normalized.id);
  const record = index >= 0 ? mergeRecord(records[index], normalized) : normalized;

  if (index >= 0) {
    records[index] = record;
  } else {
    records.unshift(record);
  }

  await writeCollection(collection, records);
  return record;
}

async function deleteRecord(collection, id) {
  const records = await readCollection(collection);
  const next = records.filter((record) => record.id !== id);
  await writeCollection(collection, next);
  return records.length !== next.length;
}

async function patchRecord(collection, id, input) {
  const records = await readCollection(collection);
  const index = records.findIndex((record) => record.id === id);
  const existing = index >= 0 ? records[index] : { id };
  const normalized = normalizeRecord(collection, {
    ...existing,
    ...input,
    id,
    createdAt: existing.createdAt
  });
  const record = { ...normalized, updatedAt: new Date().toISOString() };

  if (index >= 0) {
    records[index] = record;
  } else {
    records.unshift(record);
  }

  await writeCollection(collection, records);
  return record;
}

function filterRecords(records, query = {}) {
  const search = String(query.search || "").trim().toLowerCase();
  return records.filter((record) => {
    const matchesStatus = !query.status || String(record.status || record.stage || "") === String(query.status);
    const haystack = Object.values(record).join(" ").toLowerCase();
    return matchesStatus && (!search || haystack.includes(search));
  });
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});

      const contentType = String(req.headers["content-type"] || "");
      try {
        if (contentType.includes("application/x-www-form-urlencoded")) return resolve(parseQuery(raw));
        if (contentType.includes("multipart/form-data")) return resolve({});
        return resolve(JSON.parse(raw));
      } catch {
        return resolve(parseQuery(raw));
      }
    });
    req.on("error", reject);
  });
}

function wantsHtml(req) {
  return String(req.headers.accept || "").includes("text/html");
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("access-control-allow-headers", "authorization,content-type,x-novex-token");
  res.end(JSON.stringify(payload));
}

function redirect(res, location) {
  res.statusCode = 303;
  res.setHeader("location", location);
  res.end();
}

function isAuthorized(req) {
  const token = process.env.CRM_API_TOKEN;
  if (!token) return true;

  const authorization = String(req.headers.authorization || "");
  return authorization === `Bearer ${token}` || req.headers["x-novex-token"] === token;
}

function storageInfo() {
  return {
    mode: hasRedis() ? "redis" : "local-file",
    persistent: hasRedis()
  };
}

async function seedContactFromLead(lead) {
  if (!lead.email && !lead.phone) return null;

  const contacts = await readCollection("contacts");
  const existing = contacts.find((contact) => {
    return (lead.email && contact.email === lead.email) || (lead.phone && contact.phone === lead.phone);
  });

  return upsertRecord("contacts", {
    ...(existing || {}),
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    source: lead.source,
    notes: lead.notes
  });
}

async function dashboard() {
  const [leads, contacts, deals, tasks] = await Promise.all([
    readCollection("leads"),
    readCollection("contacts"),
    readCollection("deals"),
    readCollection("tasks")
  ]);

  const openDeals = deals.filter((deal) => !["won", "lost"].includes(deal.stage));
  const openTasks = tasks.filter((task) => task.status !== "done");
  const today = new Date().toDateString();

  return {
    leads: leads.length,
    newLeads: leads.filter((lead) => lead.status === "new").length,
    hotLeads: leads.filter((lead) => lead.priority === "hot").length,
    contacts: contacts.length,
    openDeals: openDeals.length,
    pipelineValue: openDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0),
    openTasks: openTasks.length,
    dueToday: openTasks.filter((task) => task.dueAt && new Date(task.dueAt).toDateString() === today).length,
    recentLeads: leads.slice(0, 5),
    storage: storageInfo()
  };
}

function createCollectionHandler(collection, options = {}) {
  return async function handler(req, res) {
    if (req.method === "OPTIONS") return sendJson(res, 200, { ok: true });

    try {
      const url = new URL(req.url, "https://novexdigital.co.za");
      const id = url.searchParams.get("id");

      if (req.method === "GET") {
        if (!isAuthorized(req)) return sendJson(res, 401, { error: "Unauthorized." });
        const records = await readCollection(collection);
        const filtered = filterRecords(records, Object.fromEntries(url.searchParams.entries()));
        return sendJson(res, 200, { [collection]: filtered, storage: storageInfo() });
      }

      if (req.method === "POST") {
        const expectedWebhookToken = process.env.NOVEX_WEBHOOK_TOKEN;
        const publicLeadPost = collection === "leads" && options.publicPost !== false;
        const providedWebhookToken = req.headers["x-novex-token"];

        if (providedWebhookToken && expectedWebhookToken && providedWebhookToken !== expectedWebhookToken) {
          return sendJson(res, 401, { error: "Unauthorized webhook token." });
        }

        if (!publicLeadPost && !isAuthorized(req)) return sendJson(res, 401, { error: "Unauthorized." });

        const body = await readBody(req);
        const entries = Array.isArray(body) ? body : Array.isArray(body[collection]) ? body[collection] : [body];
        const records = [];

        for (const entry of entries) {
          const record = await upsertRecord(collection, entry);
          records.push(record);

          if (collection === "leads" && options.createContact !== false) {
            await seedContactFromLead(record);
          }
        }

        if (collection === "leads" && wantsHtml(req)) {
          return redirect(res, "/#contact?submitted=true");
        }

        return sendJson(res, 200, { ok: true, [collection]: records, storage: storageInfo() });
      }

      if (req.method === "PATCH") {
        if (!isAuthorized(req)) return sendJson(res, 401, { error: "Unauthorized." });
        const body = await readBody(req);
        const recordId = id || body.id;
        if (!recordId) return sendJson(res, 400, { error: "Missing record id." });
        const record = await patchRecord(collection, recordId, body);
        return sendJson(res, 200, { ok: true, record, storage: storageInfo() });
      }

      if (req.method === "DELETE") {
        if (!isAuthorized(req)) return sendJson(res, 401, { error: "Unauthorized." });
        if (!id) return sendJson(res, 400, { error: "Missing record id." });
        const deleted = await deleteRecord(collection, id);
        return sendJson(res, deleted ? 200 : 404, { ok: deleted, storage: storageInfo() });
      }

      return sendJson(res, 405, { error: "Method not allowed." });
    } catch (error) {
      return sendJson(res, 500, { error: error.message || "Unexpected CRM API error." });
    }
  };
}

module.exports = {
  COLLECTIONS,
  createCollectionHandler,
  dashboard,
  isAuthorized,
  patchRecord,
  readCollection,
  sendJson,
  storageInfo
};
