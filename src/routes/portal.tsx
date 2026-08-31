import { createFileRoute } from "@tanstack/react-router";
import { InternalPortalHome } from "@/components/internal-portal";

export const Route = createFileRoute("/portal")({ component: InternalPortalHome });
