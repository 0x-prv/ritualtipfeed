import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { sendTip } from "@/lib/wallet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { addLocalTip } from "@/lib/localTips";
import { useNavigate } from "@tanstack/react-router";

const tipSchema = z.object({
  recipient: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,18})?$/, "Invalid amount")
    .refine((v) => parseFloat(v) > 0, "Amount must be > 0"),
  message: z.string().trim().max(280, "Max 280 chars").optional(),
});

export function TipForm({
  account,
  prefillRecipient,
  onSent,
}: {
  account: string | null;
  prefillRecipient?: string;
  onSent: (tip: {
    sender: string;
    recipient: string;
    amount: string;
    message: string;
    txHash: string;
  }) => void;
}) {
  const [recipient, setRecipient] = useState(prefillRecipient ?? "");
  const [amount, setAmount] = useState("0.01");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Sync prefill when changes from parent
  if (prefillRecipient && prefillRecipient !== recipient && !loading) {
    setRecipient(prefillRecipient);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account) {
      toast.error("Connect MetaMask first");
      return;
    }
    const parsed = tipSchema.safeParse({ recipient, amount, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const txHash = await sendTip({
        from: account,
        to: parsed.data.recipient,
        amountRitual: parsed.data.amount,
      });
      const { error } = await supabase.from("tips").insert({
        sender_address: account,
        recipient_address: parsed.data.recipient,
        amount: parseFloat(parsed.data.amount),
        message: parsed.data.message || null,
        tx_hash: txHash,
      });
      if (error) console.error(error);
      toast.success("Tip sent!");
      addLocalTip({
        sender_address: account,
        recipient_address: parsed.data.recipient,
        amount: parseFloat(parsed.data.amount),
        message: parsed.data.message || null,
      });
      onSent({
        sender: account,
        recipient: parsed.data.recipient,
        amount: parsed.data.amount,
        message: parsed.data.message || "",
        txHash,
      });
      setMessage("");
      navigate({ to: "/" });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipient">Recipient address</Label>
        <Input
          id="recipient"
          placeholder="0x…"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (RITUAL)</Label>
        <Input
          id="amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea
          id="message"
          placeholder="Keep ritualizing 🜂"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={280}
        />
      </div>
      <Button type="submit" disabled={loading || !account} className="w-full" size="lg">
        <Send className="mr-2 h-4 w-4" />
        {loading ? "Sending…" : account ? "Send Tip" : "Connect wallet first"}
      </Button>
    </form>
  );
}