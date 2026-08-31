import { createFileRoute } from "@tanstack/react-router";
import { ManagerLogin } from "@/components/internal-portal";

export const Route = createFileRoute("/portal/manager")({ component: ManagerLogin });
