# Railway AI Workflow Deployment Readiness

## Status

Feature development is frozen until the Railway database has the AI workflow tables and the Exam Creator Agent V1 end-to-end validation passes.

The latest validation failed because Railway did not have:

```text
public.ai_workflow_requests
```

This means the backend code compiled, but the database is not migrated for NIDUS GURU yet.

## Required Migrations

The AI workflow deployment depends on this order:

1. `20260613090000_add_teacher_academic_execution_foundation`
2. `20260613103000_add_assignment_submission_records`
3. `20260613110000_add_material_review_fields`
4. `20260613113000_add_teacher_exam_test_bridge`
5. `20260614130000_add_ai_workflow_engine`
6. `20260614143000_harden_ai_workflow_engine`

Critical AI migrations:

```text
20260614130000_add_ai_workflow_engine
20260614143000_harden_ai_workflow_engine
```

## Migration Dependency Check

`20260614130000_add_ai_workflow_engine` creates:

- `ai_workflow_requests`
- `ai_workflow_context`
- `ai_workflow_context_sources`
- `ai_workflow_drafts`
- `ai_workflow_draft_versions`
- `ai_workflow_reviews`
- `ai_workflow_approvals`
- `ai_workflow_feedback`
- `ai_workflow_publications`
- `ai_workflow_audit_events`

`20260614143000_harden_ai_workflow_engine` depends on those tables and adds:

- soft delete fields
- actor role/name/user snapshots
- publication approval links
- required `draftId` on publications
- actor indexes

Do not apply the hardening migration before the base AI workflow migration.

## Destructive Migration Scan

AI workflow migrations:

- No `DROP TABLE`
- No `DROP COLUMN`
- No `TRUNCATE`
- No `DELETE FROM`
- One controlled `DROP CONSTRAINT` on `ai_workflow_publications_draftId_fkey`, immediately recreated with the hardened relation.

Older migrations contain destructive statements:

```text
20260517090000_add_cookie_session_auth
- DROP COLUMN IF EXISTS "tokenVersion"
- DROP TABLE IF EXISTS "RefreshToken"
- DROP TABLE IF EXISTS "TokenBlacklist"
- DROP TABLE IF EXISTS "AuthSession"
- DROP TABLE IF EXISTS "PasswordResetToken"
- DROP TABLE IF EXISTS "AuthVerificationToken"
```

Therefore, before running `migrate deploy`, confirm migration status. If those older migrations are already applied, this is not a new risk. If Railway says they are pending, stop and review before proceeding.

## Pre-Deployment Checklist

Run from:

```powershell
cd D:\AIRA\APPS\nidus\nidus-platform\backend
```

1. Confirm you are pointing to the intended Railway database.

```powershell
node -e "require('dotenv').config(); const u=new URL(process.env.DATABASE_URL); console.log({host:u.hostname, port:u.port, database:u.pathname.slice(1)})"
```

2. Take a Railway database backup or snapshot.

Minimum recommended backup:

```powershell
pg_dump "%DATABASE_URL%" --format=custom --file "nidus-before-ai-workflow.backup"
```

If `pg_dump` is unavailable locally, use Railway's database backup/snapshot facility before continuing.

3. Check migration status.

```powershell
npx prisma migrate status --config prisma.config.ts
```

Expected:

- only recent academic / AI workflow migrations pending, or
- all migrations applied after deployment.

Stop if old destructive auth migrations appear pending unexpectedly.

4. Validate schema before deploy.

```powershell
npx prisma validate --config prisma.config.ts
```

5. Confirm backend build.

```powershell
npm run build
```

## Deployment Commands

Run:

```powershell
cd D:\AIRA\APPS\nidus\nidus-platform\backend
npx prisma migrate deploy --config prisma.config.ts
npx prisma generate --config prisma.config.ts
npm run build
```

Do not use:

```text
prisma db push --accept-data-loss
```

for this production database.

## Post-Deployment Table Verification

After `migrate deploy`, verify the AI workflow tables exist.

```powershell
node --input-type=module -e "import 'dotenv/config'; import pg from 'pg'; const c=new pg.Client({connectionString:process.env.DATABASE_URL}); await c.connect(); const r=await c.query(`select table_name from information_schema.tables where table_schema='public' and table_name like 'ai_workflow_%' order by table_name`); console.log(r.rows); await c.end();"
```

Expected tables:

- `ai_workflow_approvals`
- `ai_workflow_audit_events`
- `ai_workflow_context`
- `ai_workflow_context_sources`
- `ai_workflow_draft_versions`
- `ai_workflow_drafts`
- `ai_workflow_feedback`
- `ai_workflow_publications`
- `ai_workflow_requests`
- `ai_workflow_reviews`

## Foreign Key Verification

```powershell
node --input-type=module -e "import 'dotenv/config'; import pg from 'pg'; const c=new pg.Client({connectionString:process.env.DATABASE_URL}); await c.connect(); const r=await c.query(`select conname from pg_constraint where conname like 'ai_workflow_%_fkey' order by conname`); console.log(r.rows); await c.end();"
```

Expected key relations include:

- context -> request
- context sources -> context
- drafts -> request
- draft versions -> draft
- reviews -> request/draft
- approvals -> request/draft/publication
- feedback -> request/draft
- publications -> request/draft/approval
- audit events -> request

## API Health Verification

After deploy:

```powershell
curl https://nidusacademy.in/api/health
```

Expected:

```json
{
  "status": "ok"
}
```

Then confirm the backend has restarted with the new build.

## E2E Exam Creator Validation

Run the Exam Creator Agent V1 simulation after migrations are applied.

Expected success sequence:

1. Teacher creates exam request.
2. `ai_workflow_requests` row created.
3. `ai_workflow_context` row created.
4. `ai_workflow_context_sources` rows created.
5. `ai_workflow_drafts` row created.
6. `ai_workflow_draft_versions` row created.
7. Review creates `ai_workflow_reviews`.
8. Approval creates `ai_workflow_approvals`.
9. Publish creates `ai_workflow_publications`.
10. Publish creates student-facing `Test` and `Question` rows.
11. Publish creates `TeacherExamRecord`.
12. Audit events are created.

Validation should also confirm:

- no batch selected is blocked
- no active students is blocked
- OpenAI failure falls back safely in development
- approval missing is blocked
- invalid role is blocked
- invalid batch assignment is blocked
- duplicate publish is blocked

## Cleanup Test Data

Validation records are prefixed:

```text
NIDUS_GURU_E2E_
```

After validation, archive the generated IDs in the test report, then clean them only if you are certain they are not needed for audit.

Suggested cleanup target types:

- `User`
- `Course`
- `Batch`
- `BatchStudent`
- `TeacherBatchAssignment`
- `TeacherSyllabusProgressRecord`
- `TeacherCalendarLogRecord`
- `TeacherStudyMaterialRecord`
- `QuestionBankItem`
- `AiWorkflow*`
- `Test`
- `Question`
- `TeacherExamRecord`

Do not run broad delete commands without reviewing the exact prefix and IDs first.

## Rollback Strategy

Preferred rollback:

1. Restore Railway database backup/snapshot.
2. Redeploy previous backend build if needed.
3. Re-run health check.

Prisma does not provide automatic down migrations for production. Do not manually drop AI workflow tables unless a backup exists and the exact impact is reviewed.

## Go / No-Go Verdict

Go only when:

- database backup exists
- `migrate status` is understood
- old destructive migrations are not unexpectedly pending
- schema validates
- backend builds
- AI workflow tables verify after deploy
- E2E Exam Creator validation passes

No-Go if:

- Railway database is unreachable
- migration status cannot be read
- old destructive migrations unexpectedly appear pending
- backup is missing
- AI workflow table verification fails
- E2E validation fails after migration
