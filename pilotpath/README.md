# PilotPath Academy

DGCA pilot written-exam practice app — web + mobile responsive.

## How to run

```
cd pilotpath
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Where data lives

| What | Where |
|---|---|
| Question data | `DATA_DIR` in `.env.local` (default: `app-data/seed`) |
| User accounts | `app-data/users.json` (auto-created) |
| User progress | `app-data/progress/{userId}.json` (auto-created) |
| Subjects display metadata | `{DATA_DIR}/subjects.json` (optional) |

### Your question folder format

Point `DATA_DIR` in `.env.local` at your scraper output folder:

```
DATA_DIR=C:/Users/bharathsai.tannidi/scraper-demo/output_pilotexam
```

Each subject is a numbered subfolder with a `data.json`:

```
output_pilotexam/
  01-meteorology/data.json
  02-air-regulation/data.json
  03-3-instrumentation/data.json
  subjects.json   ← optional display overrides
```

`data.json` format (flat array):
```json
[
  {
    "id": "met-1",
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "B",
    "explanation": "...",
    "chapter": "optional",
    "formula": "optional"
  }
]
```

---

## How login works

- Passwords are hashed with **bcrypt** (12 rounds). Plaintext is never stored.
- Sessions use a signed **JWT** stored in an `httpOnly` cookie (30-day expiry).
- Set `SESSION_SECRET` in `.env.local` to a long random string before deploying.

### To upgrade login later

The auth is isolated in `lib/UserStore.ts` and `lib/session.ts`.

**Option A — Phone OTP (recommended for India):** Implement a new `UserStore` that sends SMS via Twilio/MSG91, replace `session.ts` with OTP verification. Nothing else changes.

**Option B — Google Sign-In:** Add NextAuth.js (`next-auth`), replace the login/register pages. Session cookie format stays the same.

**Option C — Managed auth (Clerk/Firebase/Supabase):** Install the SDK, replace `lib/session.ts`'s `getSession()` with their equivalent. Remove `lib/UserStore.ts` entirely.

---

## How to swap the data source (JSON → database)

1. Create `lib/DatabaseDataSource.ts` implementing the `DataSource` interface from `lib/types.ts`
2. Set `DATA_SOURCE=database` in `.env.local`
3. Uncomment the `DatabaseDataSource` branch in `lib/datasource.ts`
4. That's it — no app/page code changes needed.

The same `DataSource` interface could be exposed as an **MCP server** with no rewrite — each method maps 1:1 to an MCP tool.

---

## Exam Readiness formula

```
Readiness = (coverage × 40%) + (accuracy × 40%) + (mock_avg × 20%)

coverage  = questionsAttempted / totalAvailable  (capped at 100%)
accuracy  = average correct% across all practice attempts
mock_avg  = average score of last 3 mock attempts (0 if none)
```

Labels: 0–24 "Just Starting", 25–49 "Building Base", 50–69 "On Track",
70–84 "Almost Ready", 85–100 "Ready to Fly"
