"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { EVENTS, type RoomState } from "@kngl/shared";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "error";

/**
 * Odaya bağlanır, durum akışını tutar. Yeniden bağlanmada otomatik olarak tekrar katılır.
 * Ses verisi bu kanaldan geçmez; yalnızca küçük durum olayları.
 */
export function useRoomSocket(code: string, token: string, realtimeUrl: string, initial: RoomState) {
  const [state, setState] = useState<RoomState>(initial);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(realtimeUrl || undefined, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5_000,
      withCredentials: true,
    });
    socketRef.current = socket;

    const join = () => socket.emit(EVENTS.join, { code }, (r: { ok: boolean; state?: RoomState; error?: string }) => {
      if (r.ok && r.state) setState(r.state);
      else setError(r.error ?? "Odaya katılamadın.");
    });

    socket.on("connect", () => {
      setStatus("connected");
      setError(null);
      join();
    });
    socket.io.on("reconnect_attempt", () => setStatus("reconnecting"));
    socket.on("connect_error", (e) => {
      setStatus("error");
      setError(e.message === "unauthorized" ? "Oturumun doğrulanamadı. Sayfayı yenile." : "Bağlantı kurulamadı, tekrar deneniyor…");
    });
    socket.on(EVENTS.state, (s: RoomState) => setState(s));
    socket.on(EVENTS.error, (e: { message: string }) => {
      setError(e.message);
      setTimeout(() => setError((cur) => (cur === e.message ? null : cur)), 5_000);
    });

    return () => {
      socket.emit(EVENTS.leave);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [code, token, realtimeUrl]);

  const emit = (event: string, payload?: unknown) => socketRef.current?.emit(event, payload);

  return { state, status, error, emit };
}
