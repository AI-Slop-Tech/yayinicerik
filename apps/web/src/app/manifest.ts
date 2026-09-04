import type { MetadataRoute } from "next";
import { BRAND } from "@kngl/shared";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.shortName,
    description: "Arkadaşlarınla online dublaj oyunu.",
    start_url: "/",
    display: "standalone",
    background_color: "#090b11",
    theme_color: "#090b11",
    lang: "tr",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
