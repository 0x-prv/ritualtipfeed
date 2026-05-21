import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/check-ins")({
  component: () => <Navigate to="/checkin" />,
});
