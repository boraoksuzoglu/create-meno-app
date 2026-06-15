/**
 * doc-introspect.js
 * ──────────────────
 * Shared introspection core used by BOTH the Swagger util and the Markdown docs
 * generator (`npm run docs`). It derives API documentation from the code that is
 * already the source of truth — Joi validation schemas, route files, controllers,
 * services and Mongoose models — so request bodies, query params and response
 * shapes do not have to be hand-written (and cannot drift).
 *
 * Everything here is pure parsing/conversion: no DB, no network. Validation
 * schemas are read by dynamic import (they only build Joi objects), and failures
 * degrade gracefully to null rather than throwing.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// ── Joi → schema object ─────────────────────────────────────────────────────

const joiTypeMap = {
  string: { type: 'string' },
  number: { type: 'number' },
  boolean: { type: 'boolean' },
  date: { type: 'string', format: 'date-time' },
  array: { type: 'array' },
  object: { type: 'object' },
};

const joiDescToSchema = (desc) => {
  if (!desc) return { type: 'object' };

  if (desc.type === 'object' && desc.keys) {
    const properties = {};
    const required = [];
    for (const [key, child] of Object.entries(desc.keys)) {
      properties[key] = joiDescToSchema(child);
      const flags = child.flags || {};
      if (flags.presence === 'required') required.push(key);
    }
    return {
      type: 'object',
      ...(Object.keys(properties).length ? { properties } : {}),
      ...(required.length ? { required } : {}),
    };
  }

  const base = joiTypeMap[desc.type] || { type: 'string' };
  const result = { ...base };
  if (desc.rules) {
    for (const rule of desc.rules) {
      if (rule.name === 'email') result.format = 'email';
      if (rule.name === 'min') result.minLength = rule.args?.limit;
      if (rule.name === 'max') result.maxLength = rule.args?.limit;
    }
  }
  if (desc.allow && desc.allow.length > 0) {
    // Keep only primitive allowed values — drop Joi refs / objects (e.g. from
    // `.valid(Joi.ref('password'))`), which are not real enum members.
    const filtered = desc.allow.filter(
      (v) => (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') && v !== ''
    );
    if (filtered.length > 0) result.enum = filtered;
  }
  return result;
};

/** Convert a live Joi schema to a plain schema object, or null. */
export const joiToSchema = (joiSchema) => {
  if (!joiSchema || !joiSchema.describe) return null;
  try {
    return joiDescToSchema(joiSchema.describe());
  } catch {
    return null;
  }
};

/** Dynamically import a validation module and return the named Joi schema, or null. */
export const resolveValidationSchema = async (valFilePath, varName) => {
  try {
    if (!fs.existsSync(valFilePath)) return null;
    const mod = await import(pathToFileURL(valFilePath).href);
    return mod[varName] || null;
  } catch {
    return null;
  }
};

// ── schema object → Markdown rows / example ──────────────────────────────────

/** Flatten a schema's top-level properties into table rows. */
export const schemaToRows = (schema) => {
  if (!schema || !schema.properties) return [];
  const required = new Set(schema.required || []);
  return Object.entries(schema.properties).map(([name, prop]) => {
    const type = prop.format ? `${prop.type} (${prop.format})` : prop.type || 'string';
    const notes = [];
    if (prop.enum) notes.push(`enum: ${prop.enum.join(', ')}`);
    if (prop.minLength !== undefined) notes.push(`min ${prop.minLength}`);
    if (prop.maxLength !== undefined) notes.push(`max ${prop.maxLength}`);
    return { name, type, required: required.has(name), notes: notes.join(', ') };
  });
};

/** Build an example value for a single schema property. */
const exampleForProp = (prop) => {
  if (prop.enum && prop.enum.length) return prop.enum[0];
  switch (prop.type) {
    case 'number':
      return 0;
    case 'boolean':
      return true;
    case 'array':
      return [];
    case 'object':
      return prop.properties ? schemaToExample(prop) : {};
    case 'string':
      if (prop.format === 'email') return 'user@example.com';
      if (prop.format === 'date-time') return '2026-01-01T00:00:00.000Z';
      return 'string';
    default:
      return 'string';
  }
};

/** Build an example JSON object from a schema object. */
export function schemaToExample(schema) {
  if (!schema || !schema.properties) return {};
  const out = {};
  for (const [name, prop] of Object.entries(schema.properties)) out[name] = exampleForProp(prop);
  return out;
}

// ── Route file parser (block model, multi-line hardened) ─────────────────────

/** Join lines[i..] until parentheses balance (cap a few lines) — handles multi-line calls. */
const gatherCall = (lines, i) => {
  let segment = '';
  let depth = 0;
  for (let j = i; j < lines.length && j < i + 8; j++) {
    segment += lines[j] + '\n';
    for (const ch of lines[j]) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
    }
    if (depth <= 0 && j > i - 1 && segment.includes('(')) break;
  }
  return segment;
};

const parseRoles = (segment) => {
  const m = segment.match(/hasRole\(\s*(\[[^\]]*\]|[^)]*)\)/);
  if (!m) return [];
  return m[1]
    .replace(/[[\]]/g, '')
    .split(',')
    .map((s) => s.trim().replace(/['"`]/g, ''))
    .filter(Boolean);
};

/**
 * Parse a *.routes file into neutral endpoint descriptors.
 * Block model: `@doc` opens a block; @desc/@body/@query/@response attach to it;
 * the next router.<method>(...) call finalises it.
 */
export const parseRouteFile = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const endpoints = [];
  let block = null;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    const docMatch = trimmed.match(/\/\/\s*@doc\s+(.+)/);
    if (docMatch) {
      const [summary, statusStr] = docMatch[1].split('|').map((s) => s.trim());
      block = { summary, status: statusStr ? parseInt(statusStr, 10) : undefined, responses: [] };
      continue;
    }
    if (!block) continue;

    const tag = (re) => trimmed.match(re);
    const descM = tag(/\/\/\s*@desc\s+(.+)/);
    if (descM) { block.desc = descM[1].trim(); continue; }
    const bodyM = tag(/\/\/\s*@body\s+(.+)/);
    if (bodyM) { block.bodyOverride = bodyM[1].trim(); continue; }
    const queryM = tag(/\/\/\s*@query\s+(.+)/);
    if (queryM) { block.queryOverride = queryM[1].trim(); continue; }
    const respM = tag(/\/\/\s*@response\s+(\d+)\s+(.+)/);
    if (respM) { block.responses.push({ code: respM[1], body: respM[2].trim() }); continue; }

    if (/router\.(get|post|put|patch|delete)\s*\(/i.test(trimmed)) {
      const segment = gatherCall(lines, i);
      const method = segment.match(/router\.(get|post|put|patch|delete)/i)[1].toUpperCase();
      const pathM = segment.match(/router\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/);
      const routePath = pathM ? pathM[1] : '/';
      const bodyVar = (segment.match(/validateBody\(\s*(\w+)/) || [])[1] || null;
      const queryVar = (segment.match(/validateQuery\(\s*(\w+)/) || [])[1] || null;
      const handlerMatches = [...segment.matchAll(/\b(\w+)\.(\w+)\b/g)].filter(
        (m) => !/^(router|req|res|next|Joi|Promise|console)$/.test(m[1])
      );
      const handler = handlerMatches.length ? handlerMatches[handlerMatches.length - 1][2] : null;

      endpoints.push({
        method,
        path: routePath,
        handler,
        summary: block.summary || `${method} ${routePath}`,
        status: block.status || (method === 'POST' ? 201 : 200),
        desc: block.desc || '',
        hasAuth: /\bisAuthenticated\b/.test(segment),
        roles: parseRoles(segment),
        bodyVar,
        queryVar,
        bodyOverride: block.bodyOverride || '',
        queryOverride: block.queryOverride || '',
        responses: block.responses,
      });
      block = null;
      continue;
    }

    if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('*')) block = null;
  }
  return endpoints;
};

// ── Mongoose model parser ────────────────────────────────────────────────────

/** Extract the object literal that starts at `openIdx` (index of its `{`). */
export const extractBraceBlock = (src, openIdx) => {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(openIdx + 1, i);
    }
  }
  return '';
};

/** Split an object body into top-level `key: value` pairs (brace/bracket aware). */
export const splitTopLevelEntries = (body) => {
  const entries = [];
  let depth = 0;
  let current = '';
  for (const ch of body) {
    if (ch === '{' || ch === '[' || ch === '(') depth++;
    else if (ch === '}' || ch === ']' || ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      if (current.trim()) entries.push(current.trim());
      current = '';
    } else current += ch;
  }
  if (current.trim()) entries.push(current.trim());
  return entries;
};

const cleanType = (token) => token.replace(/^mongoose\./, '').replace(/^Schema\.Types\./, '');

/** Describe a single schema field value (the part after `name:`). */
const describeField = (value) => {
  const v = value.trim();
  if (v.startsWith('{')) {
    const inner = extractBraceBlock(v, v.indexOf('{'));
    const props = {};
    for (const entry of splitTopLevelEntries(inner)) {
      const sep = entry.indexOf(':');
      if (sep === -1) continue;
      props[entry.slice(0, sep).trim()] = entry.slice(sep + 1).trim();
    }
    if (props.type === undefined) return { type: 'Object', required: false, enums: [], ref: null };

    let type;
    if (props.type.startsWith('[')) {
      const base = props.type.match(/\[\s*([A-Za-z.]+)/);
      type = `${base ? cleanType(base[1]) : 'Mixed'}[]`;
    } else {
      const base = props.type.match(/^([A-Za-z.]+)/);
      type = base ? cleanType(base[1]) : 'Mixed';
    }
    const required = /^true\b/.test(props.required || '');
    const enumMatch = (props.enum || '').match(/\[([^\]]*)\]/);
    const enums = enumMatch
      ? enumMatch[1].split(',').map((s) => s.trim().replace(/['"`]/g, '')).filter(Boolean)
      : [];
    const refMatch = (props.ref || '').match(/['"`](\w+)['"`]/);
    return { type, required, enums, ref: refMatch ? refMatch[1] : null };
  }
  if (v.startsWith('[')) {
    const inner = v.match(/\[\s*([A-Za-z.]+)/);
    return { type: `${inner ? cleanType(inner[1]) : 'Mixed'}[]`, required: false, enums: [], ref: null };
  }
  return { type: cleanType(v), required: false, enums: [], ref: null };
};

/** Parse a *.model file → { mongooseName, collection, description, fields, indexes }. */
export const parseModel = (filePath) => {
  if (!fs.existsSync(filePath)) return null;
  const src = fs.readFileSync(filePath, 'utf8');

  const nameMatch = src.match(/mongoose\.model\s*(?:<[^>]*>)?\s*\(\s*['"`](\w+)['"`]/);
  const mongooseName = nameMatch ? nameMatch[1] : '';
  const collection = mongooseName ? pluralize(mongooseName).toLowerCase() : '';

  const inlineDesc = src.match(/\/\/\s*@(?:model-desc|description)\s+(.+)/);
  const description = inlineDesc ? inlineDesc[1].trim() : '';

  const fields = [{ name: '_id', type: 'ObjectId', required: true, enums: [], ref: null }];
  const schemaIdx = src.search(/new\s+mongoose\.Schema\s*(?:<[^>]*>)?\s*\(/);
  let timestamps = false;
  if (schemaIdx !== -1) {
    const firstBrace = src.indexOf('{', schemaIdx);
    if (firstBrace !== -1) {
      for (const entry of splitTopLevelEntries(extractBraceBlock(src, firstBrace))) {
        const sep = entry.indexOf(':');
        if (sep === -1) continue;
        const name = entry.slice(0, sep).trim().replace(/['"`]/g, '');
        if (!/^\w+$/.test(name)) continue;
        fields.push({ name, ...describeField(entry.slice(sep + 1)) });
      }
    }
    if (/timestamps\s*:\s*true/.test(src.slice(schemaIdx))) timestamps = true;
  }
  if (timestamps) {
    fields.push({ name: 'createdAt', type: 'Date', required: true, enums: [], ref: null });
    fields.push({ name: 'updatedAt', type: 'Date', required: true, enums: [], ref: null });
  }

  const indexes = [];
  const indexRegex = /\w+Schema\.index\s*\(([^;]+?)\)\s*;/g;
  let m;
  while ((m = indexRegex.exec(src)) !== null) indexes.push(m[1].trim().replace(/\s+/g, ' '));

  return { mongooseName, collection, description, fields, indexes };
};

// ── Response inference (controller → service → model) ────────────────────────

const SENSITIVE = /password|token|secret|hash/i;

/** Build an example resource object from parsed model fields (omits sensitive). */
export const buildResourceExample = (fields) => {
  const out = {};
  for (const f of fields || []) {
    if (SENSITIVE.test(f.name)) continue;
    if (f.enums && f.enums.length) { out[f.name] = f.enums[0]; continue; }
    if (f.type.endsWith('[]')) { out[f.name] = []; continue; }
    switch (f.type) {
      case 'ObjectId': out[f.name] = '65f1a2b3c4d5e6f7a8b9c0d1'; break;
      case 'Number': out[f.name] = 0; break;
      case 'Boolean': out[f.name] = true; break;
      case 'Date': out[f.name] = '2026-01-01T00:00:00.000Z'; break;
      case 'Object': out[f.name] = {}; break;
      default: out[f.name] = 'string';
    }
  }
  return out;
};

/** Extract the argument string of a call, starting at `marker` (which ends in `(`). */
const extractCallArg = (src, marker) => {
  const idx = src.indexOf(marker);
  if (idx === -1) return '';
  const start = idx + marker.length - 1; // points at the '('
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')') {
      depth--;
      if (depth === 0) return src.slice(start + 1, i).trim();
    }
  }
  return '';
};

/**
 * Analyse a response expression (a service `return` value or a controller
 * `res.json(...)` argument) into an envelope descriptor.
 *   { item }                  → single        { items }          → list
 *   paginatedResponse(...)    → paginated      { message: 'X' }   → message
 *   { user } / { user, token }→ object (keys)  anything else      → unknown
 */
const analyzeExpr = (expr) => {
  if (!expr) return { kind: 'unknown' };
  if (/paginatedResponse\s*\(/.test(expr)) return { kind: 'paginated' };

  const t = expr.trim();
  if (!t.startsWith('{')) return { kind: 'unknown' };

  const keys = [];
  let message = null;
  for (const entry of splitTopLevelEntries(extractBraceBlock(t, t.indexOf('{')))) {
    const sep = entry.indexOf(':');
    const key = (sep === -1 ? entry : entry.slice(0, sep)).trim().replace(/['"`]/g, '');
    if (!key || !/^\w+$/.test(key)) continue;
    keys.push(key);
    if (key === 'message' && sep !== -1) {
      const m = entry.slice(sep + 1).match(/['"`]([^'"`]+)['"`]/);
      if (m) message = m[1];
    }
  }
  if (keys.length === 0) return { kind: 'unknown' };
  if (keys.length === 1 && keys[0] === 'message') return { kind: 'message', message };
  if (keys.length === 1 && keys[0] === 'item') return { kind: 'single' };
  if (keys.length === 1 && keys[0] === 'items') return { kind: 'list' };
  return { kind: 'object', keys };
};

const paginationEnvelope = (resource) => ({
  items: [resource],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
});

/**
 * Map handler name → { status, jsonArg, serviceFn } by scanning a controller.
 * `jsonArg` is the raw argument passed to res.json(...) (an object literal or a
 * variable); `serviceFn` is the service method the handler awaits, if any.
 */
const parseControllerHandlers = (src) => {
  const map = {};
  for (const part of src.split(/export\s+const\s+/).slice(1)) {
    const name = (part.match(/^(\w+)/) || [])[1];
    if (!name) continue;
    map[name] = {
      status: (part.match(/res\.status\(\s*(\d+)/) || [])[1],
      jsonArg: extractCallArg(part, '.json('),
      serviceFn: (part.match(/await\s+\w+\.(\w+)\s*\(/) || [])[1],
    };
  }
  return map;
};

/** Map service function name → first `return` expression. */
const parseServiceReturns = (src) => {
  const map = {};
  for (const part of src.split(/export\s+const\s+/).slice(1)) {
    const name = (part.match(/^(\w+)/) || [])[1];
    if (!name) continue;
    const ret = part.match(/return\s+([^;]+);/);
    map[name] = ret ? ret[1].trim() : '';
  }
  return map;
};

const resourceFor = (modelsDir, key, ext) => {
  if (!modelsDir) return null;
  const model = parseModel(path.join(modelsDir, `${key}.model.${ext}`));
  return model ? buildResourceExample(model.fields) : null;
};

/**
 * Infer a response { status, example } for an endpoint by following
 * route handler → controller (res.json arg / service return) → model resource.
 * Returns null when it cannot be resolved (caller falls back to status only).
 */
export const inferResponseExample = (moduleDir, moduleName, endpoint, ext, modelsDir) => {
  try {
    const ctrlPath = path.join(moduleDir, `${moduleName}.controller.${ext}`);
    if (!endpoint.handler || !fs.existsSync(ctrlPath)) return null;

    const h = parseControllerHandlers(fs.readFileSync(ctrlPath, 'utf8'))[endpoint.handler];
    if (!h) return null;
    const status = (h.status && parseInt(h.status, 10)) || endpoint.status;

    // Resolve the payload expression: a controller-level literal (e.g. logout's
    // { message: 'LOGGED_OUT' }), else the awaited service function's return.
    let expr = h.jsonArg && h.jsonArg.startsWith('{') ? h.jsonArg : '';
    if (!expr && h.serviceFn) {
      const svcPath = path.join(moduleDir, `${moduleName}.service.${ext}`);
      if (fs.existsSync(svcPath)) {
        expr = parseServiceReturns(fs.readFileSync(svcPath, 'utf8'))[h.serviceFn] || '';
      }
    }

    const env = analyzeExpr(expr);
    if (env.kind === 'unknown') return null;
    if (env.kind === 'message') return { status, example: { message: env.message } };

    // item/items/paginated wrap the module's own resource.
    const own = resourceFor(modelsDir, moduleName, ext) || {};
    if (env.kind === 'paginated') return { status, example: paginationEnvelope(own) };
    if (env.kind === 'list') return { status, example: { items: [own] } };
    if (env.kind === 'single') return { status, example: { item: own } };

    // Generic object envelope: map each key to a model of the same name, e.g.
    // { user } → { user: <User resource> }; unknown keys become a placeholder.
    const example = {};
    for (const key of env.keys) {
      example[key] = resourceFor(modelsDir, key, ext) || 'string';
    }
    return { status, example };
  } catch {
    return null;
  }
};

// ── Shared string helper ──────────────────────────────────────────────────────

/** Naive English pluralize — enough for collection names. */
export function pluralize(word) {
  if (!word) return word;
  if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) return word.slice(0, -1) + 'ies';
  if (/(s|x|z|ch|sh)$/i.test(word)) return word + 'es';
  return word + 's';
}

/** The standard error response shape emitted by the error middleware. */
export const errorResponseShape = { status: 422, message: 'VALIDATION_ERROR' };
