# AANU Integration Boundary

AANU is hosted on a separate server. Sanatan Gyan V2 never starts an AANU polling loop and never assumes ownership of AANU's webhook.

## Contract
- Base URL: `AANU_BASE_URL`
- Shared secret: `AANU_SHARED_SECRET` (environment-only)
- Requests carry `Authorization: Bearer <shared-secret>`.
- Requests also carry `X-SG-Timestamp` (Unix seconds) and `X-SG-Signature` = HMAC-SHA256(secret, `${timestamp}.${rawBody}`), hex encoded.
- Receiver should reject timestamps outside a small replay window (recommended 300 seconds) and verify the HMAC with constant-time comparison.
- Sanatan Gyan request timeout: 8 seconds.

The exact endpoint path and payload must be agreed with the separately hosted AANU server before enabling a live action. This repository does not invent an AANU endpoint or fabricate a successful response.
