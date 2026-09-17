# Production deployment checklist

## 1. Database
Run migrations in order: `001_initial.sql` through `007_production_integrations.sql` against the production PostgreSQL database. Never point production at a local filesystem database.

## 2. Vercel environment variables
Configure the values from `.env.example` in Vercel for the Production environment. Secrets must not be committed. Keep the storage bucket private.

Required for the core application: `DATABASE_URL`, `SESSION_SECRET`, `AUDIT_IP_SALT`.

Payments: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`.
Private content: `STORAGE_PROVIDER`, `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`.
AANU is optional until its separate-server contract is agreed: `AANU_BASE_URL`, `AANU_SHARED_SECRET`.

## 3. Razorpay
- Use Test Mode first and verify server-created amount equals the published scripture price.
- Configure the webhook URL as `<APP_URL>/api/payments/webhook`.
- Configure the exact webhook secret in `RAZORPAY_WEBHOOK_SECRET`.
- Enable payment captured/failed events required by the app.
- Test both checkout signature verification and webhook delivery.
- Before switching to Live Mode, replace Test credentials with Live credentials in Vercel Production only.

The app does not mark an order captured from a client redirect alone: payment signature must verify, and webhook processing independently verifies the gateway amount against the local order.

## 4. Telegram
- Set `TELEGRAM_WEBHOOK_SECRET` to a strong random value.
- Deploy first so `/api/telegram/webhook` exists.
- In Admin → Telegram, use Configure Webhook. The server calls Telegram `setWebhook` with the HTTPS app URL and secret.
- Verify `getWebhookInfo` reports the expected URL and no persistent error.
- Telegram update IDs are stored to prevent replayed updates from being processed twice.
- Do not run a second polling process for this bot in Sanatan Gyan.

## 5. AANU
AANU remains on its separate server. No endpoint path is invented here. Agree the exact endpoint/payload with the AANU owner first. The client uses a shared secret, timestamp and HMAC signature plus an 8-second timeout. The AANU receiver should enforce a replay window and constant-time signature comparison.

## 6. Smoke tests after deployment
- `GET /api/health` returns `ok: true` and reports configured integrations.
- Register/login/logout.
- Admin login and CMS publish checklist.
- Create a Test Mode Razorpay order and complete payment.
- Confirm entitlement and Reader access.
- Confirm non-entitled user receives no private file URL.
- Send `/start` to Telegram and verify only one response for a single update.
- Admin → Telegram → Configure Webhook, then re-check webhook status.
- Upload a private content file and verify its object is not publicly readable.

## 7. Go-live controls
Use HTTPS, private storage, production database backups, strong environment secrets, Razorpay Live credentials only in the Production environment, and review audit logs after the first transactions. Vercel's filesystem is not the content store.

## 8. Pre-deploy environment gate
Run `npm run verify-env` with the Production environment variables loaded. It checks required integration variables, HTTPS app URL, S3 storage provider, and minimum secret lengths. Do not print or commit the values themselves.

## 9. Payment verification rule
The browser callback is only a trigger. The server verifies the Razorpay signature and then retrieves the payment from Razorpay using server credentials. The returned payment must match the order, be INR, be captured, and equal the local order amount before entitlement is activated.
