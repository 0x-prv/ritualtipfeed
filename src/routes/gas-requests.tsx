import { createFileRoute } from "@tanstack/react-router";
import { GasRequestsPage } from "@/components/GasRequestsPage";

export const Route = createFileRoute("/gas-requests")({
  head: () => ({
    meta: [
      { title: "Gas Requests — Ritual Tip Feed" },
      {
        name: "description",
        content: "Request and fund Ritual testnet gas for community builders.",
      },
    ],
  }),
  component: GasRequestsPage,
});