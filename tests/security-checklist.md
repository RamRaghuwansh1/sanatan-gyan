# Security / release checklist

- [ ] Database uses TLS in production and least-privilege credentials.
- [ ] Admin routes enforce server-side role checks.
- [ ] Passwords are hashed with bcrypt (cost 12 or stronger policy as appropriate).
- [ ] Session cookie is HTTP-only, Secure in production, SameSite=Lax.
- [ ] Session tokens are stored hashed, never plaintext.
- [ ] Admin Telegram IDs are server-side configuration/roles, not frontend flags.
- [ ] Razorpay signatures are verified server-side.
- [ ] Razorpay webhooks are idempotent.
- [ ] Private scripture files live in private object storage; downloads use short-lived signed URLs.
- [ ] Scripture text is imported only from verified/licensed sources.
- [ ] Telegram webhook secret is configured.
- [ ] AANU uses an explicit authenticated integration boundary; no second polling process is started.
- [ ] Rate limiting / abuse protection is enabled at the production edge before public auth/payment launch.
- [ ] CSRF strategy is reviewed for every cookie-authenticated state-changing endpoint.
- [ ] CSP/security headers are reviewed before production.
