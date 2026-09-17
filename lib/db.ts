import { Pool, type QueryResultRow } from 'pg';

const globalForDb = globalThis as unknown as { sgPool?: Pool };

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');
  if (!globalForDb.sgPool) {
    globalForDb.sgPool = new Pool({ connectionString: url, max: 5, ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false } });
  }
  return globalForDb.sgPool;
}

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return getDb().query<T>(text, values);
}
