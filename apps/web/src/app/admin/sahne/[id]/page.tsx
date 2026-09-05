import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin-guard";
import { adminGetScene } from "@/lib/admin";
import { SceneForm } from "@/components/admin/scene-form";
import { MediaPanel } from "@/components/admin/media-panel";

export const dynamic = "force-dynamic";

export default async function EditScenePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const scene = await adminGetScene(id);
  if (!scene) notFound();
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{scene.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          <code className="font-mono">/sahne/{scene.slug}</code> · {scene.play_count.toLocaleString("tr-TR")} oynanma
        </p>
        <div className="mt-6">
          <SceneForm
            sceneId={scene.id}
            videoUrl={`${scene.video_url}?v=${scene.video.mtime ?? ""}`}
            hasVideo={scene.video.exists}
            initial={{
              slug: scene.slug, title: scene.title, source: scene.source, description: scene.description, durationSeconds: scene.duration_seconds,
              thumbnailUrl: scene.thumbnail_url, isVip: scene.is_vip, isPublished: scene.is_published, characters: scene.characters, lines: scene.lines,
              licenseType: scene.license_type, licenseSource: scene.license_source ?? "", licenseHolder: scene.license_holder ?? "", licenseNote: scene.license_note ?? "",
            }}
          />
        </div>
      </div>
      <MediaPanel sceneId={scene.id} slug={scene.slug} video={scene.video} videoUrl={scene.video_url} thumbnailUrl={scene.thumbnail_url} />
    </div>
  );
}
