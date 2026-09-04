"use client";

import { useEffect, useState } from "react";

const WORDS = ["kahvaltı kavgasını", "asansör krizini", "Mars inişini", "basın toplantısını", "kurbağa büyüsünü"];

export function RotatingWords() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2400);
    return () => clearInterval(t);
  }, []);
  return (
    <span key={i} className="text-gradient animate-rise inline-block">
      {WORDS[i]}
    </span>
  );
}
