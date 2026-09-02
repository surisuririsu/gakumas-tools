import { notFound } from "next/navigation";

// Unknown paths under a locale render app/[locale]/not-found.js with a real
// 404 status, instead of a 200 page that only looks like one.
export default function CatchAllPage() {
  notFound();
}
