import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/request-card")({
  component: () => <Navigate to="/gas-requests" />,
});
