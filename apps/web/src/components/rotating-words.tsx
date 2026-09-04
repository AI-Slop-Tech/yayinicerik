"use client";

import { useEffect, useState } from "react";

const WORDS = ["bir dizi sahnesini", "bir film repliğini", "bir çizgi filmi", "bir reklamı", "efsane bir anı"];

export function RotatingWords() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block align-baseline">
      <span key={i} className="text-gradient animate-rise inline-block">
        {WORDS[i]}
      </span>
    </span>
  );
}
