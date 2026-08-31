import { createFileRoute } from "@tanstack/react-router";
import { EmployeeLogin } from "@/components/internal-portal";

export const Route = createFileRoute("/portal/employee")({ component: EmployeeLogin });
