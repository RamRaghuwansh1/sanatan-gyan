# Sanatan Gyan V2

Vercel-friendly Next.js application for Sanatan Gyan with public catalog/reader, secure paid access, CMS, admin dashboard, Telegram webhook and an isolated AANU integration boundary.

## Current integrated milestone
- Admin CMS with publication readiness, chapter/verse editing and verified private content files
- Content-file replacement/version history and current-file semantics
- Authenticated reader with entitlement gate and short-lived signed file access
- Razorpay server-side order creation, checkout signature verification endpoint, webhook signature/amount checks and replay protection
- Unified admin dashboard: CMS readiness, users, entitlements, payments, audit logs and Telegram controls
- Telegram webhook with mandatory secret validation and update-idempotency; admin can configure webhook from the dashboard
- AANU remains separately hosted; integration uses an explicit signed HTTP contract and does not start polling
- Deployment health endpoint and Vercel function configuration

## Local setup
1. Copy `.env.example` to `.env.local`.
2. Provision PostgreSQL and run migrations in order: `db/001_initial.sql` through `db/007_production_integrations.sql`.
3. Install dependencies: `npm install`.
4. Run: `npm run dev`.

## Production
Use an external PostgreSQL database and private S3-compatible object storage. Put secrets only in the deployment environment. Do not use Vercel's filesystem as durable content storage.

See `DEPLOYMENT.md` for the production/test-mode checklist.

## Admin bootstrap
Set `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` (14+ characters) and optionally `BOOTSTRAP_ADMIN_NAME`, then run `node scripts/create-admin.mjs`. Do not commit bootstrap values.

## Important payment rule
Client checkout completion is not trusted as proof of payment. The server verifies the Razorpay checkout signature and the webhook independently verifies the gateway amount against the local order before granting entitlement.

## Important Telegram rule
`TELEGRAM_WEBHOOK_SECRET` is mandatory for webhook processing. Configure the webhook from Admin → Telegram after the production URL is deployed. Do not run a second polling loop for this bot.
