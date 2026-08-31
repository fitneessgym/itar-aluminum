import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({ component: LegacyLoginRedirect });

function LegacyLoginRedirect() {
  return <Navigate to="/portal" replace />;
}
