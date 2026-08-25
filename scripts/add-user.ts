/**
 * Add or reset a login (Admin or Teacher) directly in the Teachers sheet tab.
 * Hashes the password with bcrypt before storing — never stores plain text.
 *
 * Usage:
 *   npm run add-user -- "admin@school.com" "MyPassword123" "Admin Name" ADMIN
 *   npm run add-user -- "teacher@school.com" "MyPassword123" "Teacher Name" TEACHER "Chennai" "LKG" "A"
 */
import { google } from 'googleapis';
import bcrypt from 'bcryptjs';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;

async function main() {
  const [email, password, name, role = 'TEACHER', branch = '', assignedClass = '', assignedSection = ''] = process.argv.slice(2);
  if (!email || !password || !name) {
    console.error('Usage: npm run add-user -- <email> <password> <name> <ADMIN|TEACHER> [branch] [class] [section]');
    process.exit(1);
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() as any });

  const passwordHash = await bcrypt.hash(password, 10);

  // check if this email already exists — if so, update in place; else append
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Teachers!A1:ZZ' });
  const rows = res.data.values || [];
  const header = rows[0] || ['id', 'email', 'passwordHash', 'name', 'role', 'branch', 'assignedClass', 'assignedSection', 'isActive'];
  const emailIdx = header.indexOf('email');
  const existingRowIdx = rows.findIndex((r, i) => i > 0 && r[emailIdx]?.toLowerCase() === email.toLowerCase());

  const newRow = [
    existingRowIdx > 0 ? rows[existingRowIdx][0] : `T-${Date.now()}`,
    email, passwordHash, name, role.toUpperCase(), branch, assignedClass, assignedSection, 'true',
  ];

  if (existingRowIdx > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID, range: `Teachers!A${existingRowIdx + 1}`,
      valueInputOption: 'USER_ENTERED', requestBody: { values: [newRow] },
    });
    console.log(`✅ Updated existing user: ${email} (${role})`);
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID, range: 'Teachers!A1',
      valueInputOption: 'USER_ENTERED', requestBody: { values: [newRow] },
    });
    console.log(`✅ Added new user: ${email} (${role})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
