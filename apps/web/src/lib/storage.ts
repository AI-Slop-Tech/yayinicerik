import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "./env";

/**
 * Kayıt (take) depolama. Varsayılan: web ve worker arasında paylaşılan yerel volume.
 * S3/R2 gibi nesne depolama kullanılacaksa yalnızca bu dosya değişir.
 */
const SAFE = /^[A-Za-z0-9_-]+$/;

export async function saveTake(roomCode: string, lineId: string, playerId: string, data: Uint8Array, ext: string): Promise<string> {
  if (![roomCode, lineId, playerId].every((s) => SAFE.test(s))) throw new Error("Geçersiz tanımlayıcı.");
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "webm";
  const dir = path.join(env().UPLOAD_DIR, "takes", roomCode);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${lineId}__${playerId}.${safeExt}`);
  await writeFile(file, data);
  return file;
}
