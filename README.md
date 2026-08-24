# Navashiksha Weekly Assessment — Google Sheets Edition

Simplified stack: Next.js on Vercel, Google Sheets as the database, Google login for auth.
No Postgres, no separate hosting service, no Prisma. Everything lives in one spreadsheet you can
open and inspect anytime.

## How it works

- One Google Spreadsheet with tabs: `Students`, `Teachers`, `Assessments`, `ParentConcerns`, `MasterLists`, `AuditLog`.
- The app reads/writes rows via the Google Sheets API using a **service account** (a robot Google
  account with edit access to just this one spreadsheet).
- Teachers/Admin log in with their **own personal Google account** (NextAuth + Google provider).
  Whether someone can log in — and whether they're Admin or Teacher — is controlled entirely by
  rows you add to the `Teachers` tab.

## Setup — do these in order

### 1. Create the Google Sheet
1. Go to sheets.google.com → **Blank spreadsheet** → rename it "Navashiksha Weekly Assessment DB"
2. Copy the Sheet ID from the URL: `docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`
   → this is your `GOOGLE_SHEET_ID`

### 2. Create a Google Cloud project + enable Sheets API
1. console.cloud.google.com → **New Project** → name it "navashiksha"
2. **APIs & Services → Library** → search "Google Sheets API" → **Enable**
3. Also enable **Google People API** (needed for login profile info)

### 3. Create a Service Account (lets the app write to the sheet)
1. **APIs & Services → Credentials → Create Credentials → Service Account**
2. Name it `navashiksha-app`, click through, **Done**
3. Click the new service account → **Keys** tab → **Add Key → Create New Key → JSON** → downloads a file
4. Open that JSON file, copy its *entire contents* → this becomes `GOOGLE_SERVICE_ACCOUNT_JSON` (paste as one line in `.env`)
5. Copy the `client_email` field from that JSON (looks like `navashiksha-app@navashiksha.iam.gserviceaccount.com`)
6. Go back to your Google Sheet → **Share** → paste that service account email → give it **Editor** access → Send

### 4. Create OAuth credentials (lets teachers log in with Google)
1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. If prompted, configure the consent screen first: User type **External**, fill app name "Navashiksha", your email, save through the steps (you don't need to publish/verify it for a small internal tool — just add your teachers' emails under "Test users" while it's in testing mode, OR publish it since you control who can sign in via the Teachers tab anyway)
3. Application type: **Web application**
4. Authorized redirect URIs — add both:
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
   - `https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/callback/google` (add this after you deploy and know your domain)
5. Copy **Client ID** and **Client Secret** → `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`

### 5. Local setup
```bash
npm install
cp .env.example .env
```
Fill in all 5 values in `.env`. Generate `NEXTAUTH_SECRET` with:
```bash
openssl rand -base64 32
```
Then create the sheet structure + seed master data (including the 9 Parent Concern cards):
```bash
npm run setup:sheet
```

### 6. Add yourself as Admin
Open the Google Sheet → `Teachers` tab → add a row:
| id | googleEmail | name | role | branch | assignedClass | assignedSection | isActive |
|---|---|---|---|---|---|---|---|
| T-001 | your.email@gmail.com | Your Name | ADMIN | | | | true |

Add teachers the same way with `role = TEACHER` and their assigned `assignedClass`/`assignedSection`
matching values in the `Students` tab (so they only see their own students).

### 7. Add students
`Students` tab, one row per student — `class`/`section` must match what you use for teacher assignment.

### 8. Run locally
```bash
npm run dev
```
Visit `localhost:3000/login`, sign in with the Google account you added as Admin.

## Deploy to Vercel

1. Push this project to your GitHub repo (same as before).
2. vercel.com → Import Project → select the repo.
3. Add all 5 environment variables from `.env` in Vercel's Project Settings.
   - Set `NEXTAUTH_URL` to your actual Vercel URL once you know it (e.g. `https://navashiksha.vercel.app`)
4. Deploy.
5. Go back to Google Cloud Console → your OAuth client → add the production redirect URI:
   `https://your-actual-domain.vercel.app/api/auth/callback/google`
6. Redeploy if you changed `NEXTAUTH_URL` after the first deploy.

## Limits to know about

- Google Sheets API allows ~300 read/write requests per minute per project — completely fine for
  one school's daily use, not built for high concurrency.
- No transactions — two teachers submitting for the exact same student+week within the same second
  could theoretically race past the duplicate check. Vanishingly unlikely at this scale, but Admin
  can just delete the duplicate row in the sheet if it ever happens.
- Editing rows directly in the Google Sheet works fine as a manual "Admin correction" tool — the
  app will pick up the change immediately since it reads live from the sheet.
