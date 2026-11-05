import { notFound } from "next/navigation";

/**
 * Any unknown path under a locale lands here so the bilingual 404 in
 * `[locale]/not-found.tsx` is shown instead of Next.js's default page.
 * Specific routes always win over a catch-all segment.
 */
export default function CatchAllPage() {
  notFound();
}
