import { createFileRoute } from "@tanstack/react-router";
import { SiteView } from "@/components/site-view";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <SiteView />;
}
