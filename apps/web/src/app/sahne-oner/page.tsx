import type { Metadata } from "next";
import { SuggestForm } from "@/components/suggest-form";

export const metadata: Metadata = { title: "Sahne öner", description: "Kataloğa eklenmesini istediğin sahneyi öner." };

export default function SuggestPage() {
  return (
    <div className="container-x py-12">
      <div className="mx-auto max-w-xl">
        <p className="eyebrow mb-2">Katalog</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Sahne öner</h1>
        <p className="mt-3 text-ink-soft">
          Kataloğa yalnızca lisansını alabildiğimiz ya da kendi yapımımız olan içerikler girer. Önerin lisans ekibince değerlendirilir; kabul edilirse adın sahnenin altında yazar.
        </p>
        <div className="mt-8">
          <SuggestForm />
        </div>
      </div>
    </div>
  );
}
