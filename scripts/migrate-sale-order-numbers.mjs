// Run with checkout paused. Pipe an administrative OAuth token to stdin.
// Dry run: gcloud auth print-access-token | node scripts/migrate-sale-order-numbers.mjs PROJECT_ID
// Apply:   gcloud auth print-access-token | node scripts/migrate-sale-order-numbers.mjs PROJECT_ID --apply
const project = process.argv[2];
const apply = process.argv[3] === '--apply';
if (!project || !/^[a-z0-9-]+$/.test(project) || (process.argv[3] && !apply) || process.argv.length > 4) throw new Error('Provide PROJECT_ID and optionally --apply.');
let token = '';
for await (const chunk of process.stdin) token += chunk;
token = token.trim();
if (!token) throw new Error('Provide an administrative access token on stdin.');
const root = process.env.FIRESTORE_EMULATOR_HOST
  ? `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${project}/databases/(default)/documents`
  : `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
async function request(path, options = {}) {
  const response = await fetch(root + path, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  if (!response.ok) throw new Error(`Firestore request failed (HTTP ${response.status}). No further writes were attempted.`);
  return response.json();
}
async function list(collection) {
  const result = [];
  let pageToken;
  do {
    const params = new URLSearchParams({ pageSize: '300' });
    if (pageToken) params.set('pageToken', pageToken);
    const page = await request(`/${collection}?${params}`);
    result.push(...(page.documents || []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return result;
}
function timestampKey(value) {
  if (typeof value !== 'string') throw new Error('A sale has no valid creation timestamp.');
  const match = value.match(/^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d{1,9}))?Z$/);
  if (!match || !Number.isFinite(Date.parse(value))) throw new Error('A sale has no valid creation timestamp.');
  return `${match[1]}.${(match[2] || '').padEnd(9, '0')}Z`;
}
const [sales, counters] = await Promise.all([list('sales'), list('salesCounters')]);
const groups = new Map();
for (const sale of sales) {
  const storeId = sale.fields?.storeId?.stringValue;
  if (!storeId || storeId.includes('/')) throw new Error('A sale has an invalid store ID.');
  const entry = { ...sale, id: sale.name.split('/').pop(), time: timestampKey(sale.fields?.createdAt?.timestampValue) };
  if (!groups.has(storeId)) groups.set(storeId, []);
  groups.get(storeId).push(entry);
}
const counterMap = new Map(counters.map(counter => [counter.name.split('/').pop(), counter]));
let missing = 0;
let missingCounters = 0;
for (const [storeId, group] of groups) {
  group.sort((a, b) => a.time < b.time ? -1 : a.time > b.time ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  group.forEach((sale, i) => {
    const number = sale.fields?.orderNumber?.integerValue;
    if (number === undefined) missing++;
    else if (Number(number) !== i + 1) throw new Error('Existing order numbers conflict with chronological order. Migration stopped.');
  });
  const counter = counterMap.get(storeId);
  if (!counter) missingCounters++;
  if (counter && (Number(counter.fields?.lastNumber?.integerValue) !== group.length || counter.fields?.lastSaleId?.stringValue !== group.at(-1).id)) throw new Error('An existing counter conflicts with the migration. Migration stopped.');
  counterMap.delete(storeId);
}
if (counterMap.size) throw new Error('A counter exists without corresponding sales. Migration stopped.');
console.log(`${apply ? 'Applying' : 'Dry run'}: ${sales.length} sales across ${groups.size} stores; ${missing} sales need numbers; ${missingCounters} stores need counters.`);
if (apply) {
  for (const [storeId, group] of groups) {
    for (let i = 0; i < group.length; i++) {
      const sale = group[i];
      if (sale.fields?.orderNumber?.integerValue !== undefined) continue;
      await request(':commit', { method: 'POST', body: JSON.stringify({ writes: [{ update: { name: sale.name, fields: { orderNumber: { integerValue: String(i + 1) } } }, updateMask: { fieldPaths: ['orderNumber'] }, currentDocument: { updateTime: sale.updateTime } }] }) });
    }
    if (!counters.some(c => c.name.endsWith(`/salesCounters/${storeId}`))) {
      await request(':commit', { method: 'POST', body: JSON.stringify({ writes: [{ update: { name: `projects/${project}/databases/(default)/documents/salesCounters/${storeId}`, fields: { lastNumber: { integerValue: String(group.length) }, lastSaleId: { stringValue: group.at(-1).id } } }, currentDocument: { exists: false } }] }) });
    }
  }
  console.log('Migration writes complete. Run a dry run again to verify.');
}
