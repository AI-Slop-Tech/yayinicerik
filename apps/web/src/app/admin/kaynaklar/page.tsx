import { requireAdminPage } from "@/lib/admin-guard";
import { adminListScenes } from "@/lib/admin";
import { listSources } from "@/lib/media";
import { DiskWidget } from "@/components/admin/disk-widget";
import { SourceManager } from "@/components/admin/source-manager";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  await requireAdminPage();
  const [sources, scenes] = await Promise.all([listSources(), adminListScenes()]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Kaynak videolar</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Uzun bir videodan sahne kesmek için. Kesilen parça 720p&apos;ye küçültülür, kaynak silinir; diskte yalnızca sahne kalır.
        </p>
        <div className="mt-6">
          <SourceManager
            sources={sources}
            scenes={scenes.map((s) => ({ id: s.id, title: s.title, slug: s.slug, hasVideo: s.video.exists }))}
          />
        </div>
      </div>
      <DiskWidget />
    </div>
  );
}
