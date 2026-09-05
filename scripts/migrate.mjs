// Basit, bağımlılıksız migrasyon koşucusu: infra/db/migrations/*.sql dosyalarını sırayla uygular.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const dir = path.resolve(process.cwd(), "infra/db/migrations");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

await client.connect();
// Aynı anda açılan kopyalar sırayla ilerlesin: oturum düzeyinde danışma kilidi.
await client.query("SELECT pg_advisory_lock(727001)");
await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
const applied = new Set((await client.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name));
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
for (const file of files) {
  if (applied.has(file)) continue;
  const sql = await readFile(path.join(dir, file), "utf8");
  process.stdout.write(`→ ${file} ... `);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    await client.query("COMMIT");
    console.log("ok");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("HATA");
    throw err;
  }
}
await client.query("SELECT pg_advisory_unlock(727001)");
await client.end();
console.log(`Migrasyon tamam (${files.length} dosya).`);
