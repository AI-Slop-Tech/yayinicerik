"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Copy, Crown, Download, Loader2, Mic, Play, RefreshCw, Share2, Users, Wifi, WifiOff } from "lucide-react";
import { EVENTS, LIMITS, linesForPlayer, type RoomState, type Scene } from "@kngl/shared";
import { LineRecorder } from "./recorder";
import { useRoomSocket } from "./use-room-socket";

interface Props {
  code: string;
  scene: Scene;
  identity: { id: string; nickname: string; isVip: boolean };
  token: string;
  realtimeUrl: string;
  initialState: RoomState;
}

const PHASE_LABEL: Record<RoomState["phase"], string> = {
  lobby: "Lobi",
  casting: "Karakter dağıtımı",
  recording: "Kayıt",
  rendering: "Video hazırlanıyor",
  done: "Hazır",
  failed: "Hata",
};

export function RoomClient({ code, scene, identity, token, realtimeUrl, initialState }: Props) {
  const { state, status, error, emit } = useRoomSocket(code, token, realtimeUrl, initialState);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const me = state.players.find((p) => p.id === identity.id);
  const isHost = state.hostId === identity.id;
  const myChars = useMemo(() => state.assignments[identity.id] ?? [], [state.assignments, identity.id]);
  const myLines = useMemo(() => linesForPlayer(scene, myChars), [scene, myChars]);
  const connected = state.players.filter((p) => p.connected);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/katil?kod=${code}` : `/katil?kod=${code}`;

  async function copy(kind: "code" | "link") {
    try {
      await navigator.clipboard.writeText(kind === "code" ? code : shareUrl);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* pano erişimi yoksa sessizce geç */
    }
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: "KNGL Dublaj odası", text: `Odaya katıl: ${code}`, url: shareUrl }).catch(() => {});
    } else {
      await copy("link");
    }
  }

  async function uploadTake(lineId: string, blob: Blob) {
    const fd = new FormData();
    fd.append("lineId", lineId);
    fd.append("file", blob, `${lineId}.webm`);
    const res = await fetch(`/api/rooms/${code}/takes`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Yükleme başarısız.");
    emit(EVENTS.lineDone, { lineId });
  }

  const totalRequired = state.players.reduce((n, p) => n + linesForPlayer(scene, state.assignments[p.id] ?? []).length, 0);
  const totalDone = state.players.reduce((n, p) => n + p.completedLines.length, 0);

  return (
    <div className="container-x py-8">
      {/* Üst şerit */}
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => copy("code")}
            className="group flex items-center gap-2 rounded-xl border border-line bg-bg-alt px-4 py-2.5 font-mono text-2xl font-bold tracking-[0.3em] text-primary"
            title="Kodu kopyala"
          >
            {code}
            {copied === "code" ? <Check className="size-4 text-green" /> : <Copy className="size-4 text-ink-faint group-hover:text-ink" />}
          </button>
          <div>
            <p className="font-display font-semibold leading-tight">{scene.title}</p>
            <p className="text-xs text-ink-faint">
              {scene.characterCount} karakter · {PHASE_LABEL[state.phase]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`chip ${status === "connected" ? "text-green" : "text-rec"}`}>
            {status === "connected" ? <Wifi className="size-3" aria-hidden /> : <WifiOff className="size-3" aria-hidden />}
            {status === "connected" ? "Bağlı" : status === "reconnecting" ? "Yeniden bağlanıyor" : "Bağlanıyor"}
          </span>
          <button type="button" className="btn btn-secondary" onClick={share}>
            <Share2 className="size-4" aria-hidden /> {copied === "link" ? "Kopyalandı" : "Paylaş"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-rec/40 bg-rec/10 p-3 text-sm">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Ana alan */}
        <div>
          {state.phase === "lobby" && (
            <div className="card p-8 text-center">
              <Users className="mx-auto size-8 text-primary" aria-hidden />
              <h1 className="mt-3 font-display text-2xl font-bold">Oyuncular toplanıyor</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
                Kodu paylaş. {scene.characterCount} kişi ideal; {connected.length} kişi bağlı. En fazla {LIMITS.maxPlayers}.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => copy("link")}>
                  <Copy className="size-4" aria-hidden /> Bağlantıyı kopyala
                </button>
                <a
                  className="btn btn-secondary"
                  href={`https://wa.me/?text=${encodeURIComponent(`KNGL Dublaj odasına katıl: ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </div>
              {isHost ? (
                <button type="button" className="btn btn-primary mt-8 px-8 py-3.5 text-base" onClick={() => emit(EVENTS.start)} disabled={connected.length < LIMITS.minPlayers || status !== "connected"}>
                  <Play className="size-5" aria-hidden /> Karakterleri dağıt
                </button>
              ) : (
                <p className="mt-8 text-sm text-ink-faint">Oda sahibinin başlatmasını bekliyorsun…</p>
              )}
            </div>
          )}

          {state.phase === "casting" && (
            <div className="card p-8 text-center">
              <p className="eyebrow mb-2">Karakter dağıtımı</p>
              {myChars.length > 0 ? (
                <>
                  <h1 className="font-display text-3xl font-bold">
                    Sen:{" "}
                    {myChars.map((id) => {
                      const c = scene.characters.find((ch) => ch.id === id);
                      return (
                        <span key={id} style={{ color: c?.color }}>
                          {c?.name}{" "}
                        </span>
                      );
                    })}
                  </h1>
                  <p className="mt-2 text-sm text-ink-soft">{myLines.length} replik seni bekliyor. Kimin kim olduğu final videoya kadar sır.</p>
                </>
              ) : (
                <>
                  <h1 className="font-display text-3xl font-bold">Seyircisin</h1>
                  <p className="mt-2 text-sm text-ink-soft">Bu turda karakter kalmadı; final videoyu herkesle aynı anda izleyeceksin.</p>
                </>
              )}
              {isHost ? (
                <button type="button" className="btn btn-rec mt-8 px-8 py-3.5 text-base" onClick={() => emit(EVENTS.record)}>
                  <Mic className="size-5" aria-hidden /> Kayda geç
                </button>
              ) : (
                <p className="mt-8 text-sm text-ink-faint">Oda sahibi kayda geçince replikler açılır.</p>
              )}
            </div>
          )}

          {state.phase === "recording" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl font-bold">{myLines.length ? "Repliklerin" : "Kayıt sürüyor"}</h1>
                <span className="chip">
                  {totalDone} / {totalRequired} replik tamam
                </span>
              </div>
              {myLines.length === 0 && <div className="card p-8 text-center text-sm text-ink-soft">Bu turda repliğin yok; diğerlerinin bitirmesini bekle.</div>}
              {myLines.map((line) => {
                const c = scene.characters.find((ch) => ch.id === line.characterId)!;
                return (
                  <LineRecorder
                    key={line.id}
                    line={line}
                    characterName={c.name}
                    characterColor={c.color}
                    videoSrc={scene.videoUrl}
                    done={me?.completedLines.includes(line.id) ?? false}
                    onUpload={(blob) => uploadTake(line.id, blob)}
                  />
                );
              })}
            </div>
          )}

          {state.phase === "rendering" && (
            <div className="card p-10 text-center">
              <Loader2 className="mx-auto size-8 animate-spin text-primary" aria-hidden />
              <h1 className="mt-4 font-display text-2xl font-bold">Video hazırlanıyor</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">Bütün sesler birleştiriliyor. Genellikle bir dakikadan kısa sürer; sayfayı açık tut.</p>
            </div>
          )}

          {state.phase === "done" && state.finalVideoUrl && (
            <div className="card overflow-hidden">
              <video className="aspect-video w-full bg-black" src={state.finalVideoUrl} controls autoPlay playsInline poster={scene.thumbnailUrl} />
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <h1 className="font-display text-xl font-bold">Final kesim hazır</h1>
                  <p className="text-sm text-ink-soft">Seslendirenler: {state.players.filter((p) => (state.assignments[p.id] ?? []).length).map((p) => p.nickname).join(", ")}</p>
                </div>
                <div className="flex gap-2">
                  <a className="btn btn-secondary" href={state.finalVideoUrl} download>
                    <Download className="size-4" aria-hidden /> İndir
                  </a>
                  {isHost && (
                    <button type="button" className="btn btn-primary" onClick={() => emit(EVENTS.restart)}>
                      <RefreshCw className="size-4" aria-hidden /> Tekrar oyna
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {state.phase === "failed" && (
            <div className="card p-10 text-center">
              <h1 className="font-display text-2xl font-bold">Video üretilemedi</h1>
              <p className="mt-2 text-sm text-ink-soft">{state.error ?? "Beklenmeyen bir hata oluştu."}</p>
              {isHost && (
                <button type="button" className="btn btn-primary mt-6" onClick={() => emit(EVENTS.restart)}>
                  <RefreshCw className="size-4" aria-hidden /> Yeniden başlat
                </button>
              )}
            </div>
          )}
        </div>

        {/* Oyuncu paneli */}
        <aside className="card h-fit p-5">
          <h2 className="mb-3 flex items-center justify-between text-xs font-semibold tracking-widest text-ink-faint">
            OYUNCULAR <span>{connected.length}</span>
          </h2>
          <ul className="space-y-2">
            {state.players.map((p) => {
              const required = linesForPlayer(scene, state.assignments[p.id] ?? []).length;
              const c = p.characterId ? scene.characters.find((ch) => ch.id === p.characterId) : null;
              const revealChar = state.phase === "done" || p.id === identity.id;
              return (
                <li key={p.id} className={`flex items-center gap-3 rounded-xl border border-line bg-bg-alt p-3 text-sm ${p.connected ? "" : "opacity-50"}`}>
                  <span className="flex size-8 items-center justify-center rounded-full bg-surface-2 font-semibold uppercase">{p.nickname.slice(0, 1)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate font-medium">
                      {p.nickname}
                      {p.isHost && <Crown className="size-3.5 text-primary" aria-label="Oda sahibi" />}
                      {p.id === identity.id && <span className="text-xs text-ink-faint">(sen)</span>}
                    </span>
                    <span className="block text-xs text-ink-faint">
                      {state.phase === "lobby"
                        ? p.connected
                          ? "Hazır"
                          : "Ayrıldı"
                        : revealChar && c
                          ? c.name
                          : required
                            ? "Karakter gizli"
                            : "Seyirci"}
                    </span>
                  </span>
                  {state.phase === "recording" && required > 0 && (
                    <span className={`chip ${p.completedLines.length >= required ? "text-green" : ""}`}>
                      {p.completedLines.length}/{required}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <Link href="/oda-olustur" className="btn btn-ghost mt-4 w-full">
            Yeni oda kur
          </Link>
        </aside>
      </div>
    </div>
  );
}
