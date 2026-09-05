import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-guard";
import { adminListScenes } from "@/lib/admin";
import { SceneTable } from "@/components/admin/scene-table";

export const dynamic = "force-dynamic";

export default async function AdminScenesPage() {
  await requireAdminPage();
  const scenes = await adminListScenes();
  const missing = scenes.filter((s) => !s.video.exists).length;
  const unlicensed = scenes.filter((s) => s.license_type === "unknown").length;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Sahneler</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {scenes.length} sahne · {missing > 0 ? <span className="text-rec font-semibold">{missing} sahnenin videosu eksik</span> : "tüm videolar yüklü"}
            {unlicensed > 0 && <> · <span className="text-rec font-semibold">{unlicensed} sahnenin lisansı belirsiz</span></>}.
            Video: MP4 (H.264 + AAC), en fazla 2 GB. Dosya adı otomatik olarak <code className="font-mono">slug.mp4</code> olur.
          </p>
        </div>
        <Link href="/admin/sahne/yeni" className="btn btn-primary">
          <Plus className="size-4" aria-hidden /> Yeni sahne
        </Link>
      </div>
      <SceneTable scenes={scenes.map((s) => ({ id: s.id, slug: s.slug, title: s.title, source: s.source, durationSeconds: s.duration_seconds, roles: s.characters.length, lines: s.lines.length, isVip: s.is_vip, isPublished: s.is_published, playCount: s.play_count, thumbnailUrl: s.thumbnail_url, video: s.video, licenseType: s.license_type }))} />
    </div>
  );
}
