import process from 'node:process';

const required = [
  'DATABASE_URL','SESSION_SECRET','AUDIT_IP_SALT',
  'RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET',
  'TELEGRAM_BOT_TOKEN','TELEGRAM_WEBHOOK_SECRET','NEXT_PUBLIC_APP_URL',
  'STORAGE_PROVIDER','STORAGE_ENDPOINT','STORAGE_REGION','STORAGE_BUCKET',
  'STORAGE_ACCESS_KEY_ID','STORAGE_SECRET_ACCESS_KEY'
];
const missing = required.filter((k) => !process.env[k]);
const errors = [];
if (process.env.NEXT_PUBLIC_APP_URL && !/^https:\/\//i.test(process.env.NEXT_PUBLIC_APP_URL)) errors.push('NEXT_PUBLIC_APP_URL must use HTTPS');
if (process.env.STORAGE_PROVIDER && process.env.STORAGE_PROVIDER.toLowerCase() !== 's3') errors.push('STORAGE_PROVIDER must be s3 for production');
for (const k of ['SESSION_SECRET','AUDIT_IP_SALT','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET','TELEGRAM_WEBHOOK_SECRET','STORAGE_SECRET_ACCESS_KEY']) {
  if (process.env[k] && process.env[k].length < 32) errors.push(`${k} should be at least 32 characters`);
}
if (process.env.NEXT_PUBLIC_APP_URL?.endsWith('/')) errors.push('NEXT_PUBLIC_APP_URL must not end with /');
if (missing.length || errors.length) {
  console.error('Production environment validation failed.');
  if (missing.length) console.error(`Missing: ${missing.join(', ')}`);
  for (const e of errors) console.error(`Error: ${e}`);
  process.exit(1);
}
console.log('Production environment validation passed.');
