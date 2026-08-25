/**
 * Google Sheets as the database.
 *
 * One spreadsheet, one tab per "table". Each function here reads/writes
 * rows as plain objects keyed by the header row, so the rest of the app
 * never touches raw A1 ranges.
 *
 * Tabs used (created automatically by `npm run setup:sheet` on first run):
 *   Students | Teachers | Assessments | ParentConcerns | AuditLog
 *
 * Auth: a Google Service Account with edit access to the spreadsheet
 * (shared with the service account's email — see README).
 */
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth: await auth.getClient() as any });
}

/** Reads a whole tab and returns rows as objects keyed by header row 1. */
export async function readTab<T = Record<string, string>>(tab: string): Promise<T[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${tab}!A1:ZZ` });
  const rows = res.data.values;
  if (!rows || rows.length < 2) return [];
  const [header, ...data] = rows;
  return data.map((row) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => { obj[h] = row[i] ?? ''; });
    return obj as T;
  });
}

/** Appends one row to a tab, matching the existing header order. */
export async function appendRow(tab: string, rowObj: Record<string, any>): Promise<void> {
  const sheets = await getSheetsClient();
  const headerRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${tab}!A1:ZZ1` });
  const header = headerRes.data.values?.[0] ?? [];
  const row = header.map((h) => rowObj[h] ?? '');
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID, range: `${tab}!A1`,
    valueInputOption: 'USER_ENTERED', requestBody: { values: [row] },
  });
}

/** Updates a row by matching a key column (e.g. "id"), rewriting only changed cells. */
export async function updateRowByKey(tab: string, keyColumn: string, keyValue: string, patch: Record<string, any>): Promise<boolean> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${tab}!A1:ZZ` });
  const rows = res.data.values;
  if (!rows || rows.length < 2) return false;
  const header = rows[0];
  const keyIdx = header.indexOf(keyColumn);
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[keyIdx] === keyValue);
  if (rowIdx < 1) return false;

  const existing = rows[rowIdx];
  const merged = header.map((h, i) => (h in patch ? patch[h] : existing[i] ?? ''));
  const rowNumber = rowIdx + 1; // 1-indexed sheet row

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID, range: `${tab}!A${rowNumber}`,
    valueInputOption: 'USER_ENTERED', requestBody: { values: [merged] },
  });
  return true;
}

/** Finds a single row by key column value. */
export async function findRowByKey<T = Record<string, string>>(tab: string, keyColumn: string, keyValue: string): Promise<T | null> {
  const rows = await readTab<T>(tab);
  return (rows as any[]).find((r) => r[keyColumn] === keyValue) ?? null;
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Permanently removes a row matching keyColumn/keyValue from a tab (hard delete). */
export async function deleteRowByKey(tab: string, keyColumn: string, keyValue: string): Promise<boolean> {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetInfo = meta.data.sheets?.find((s) => s.properties?.title === tab);
  if (!sheetInfo?.properties?.sheetId && sheetInfo?.properties?.sheetId !== 0) return false;
  const sheetId = sheetInfo.properties.sheetId;

  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${tab}!A1:ZZ` });
  const rows = res.data.values;
  if (!rows || rows.length < 2) return false;
  const header = rows[0];
  const keyIdx = header.indexOf(keyColumn);
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[keyIdx] === keyValue);
  if (rowIdx < 1) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests: [{ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: rowIdx, endIndex: rowIdx + 1 } } }] },
  });
  return true;
}
