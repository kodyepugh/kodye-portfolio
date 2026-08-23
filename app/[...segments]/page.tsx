import { ReservoirRouteEntry } from "@/components/reservoir/ReservoirRouteEntry";
import { resolvePublicRoute } from "@/lib/public-routing";
import { notFound, redirect } from "next/navigation";

export default async function PublicRoutePage({
  params,
}: PageProps<"/[...segments]">) {
  const { segments } = await params;
  const route = resolvePublicRoute(segments);

  if (route.kind === "not-found") notFound();
  if (route.kind === "redirect-root") redirect("/");

  return <ReservoirRouteEntry route={route} />;
}
