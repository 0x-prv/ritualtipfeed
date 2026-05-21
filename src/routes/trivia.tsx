import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { avatarUrl } from "@/lib/wallet";
import { xAvatarUrl, fetchHandle } from "@/lib/profiles";
import { useWallet } from "@/lib/walletContext";
import { toPng } from "html-to-image";
import { Download, Share2, RotateCcw, Brain, Check, X } from "lucide-react";

export const Route = createFileRoute("/trivia")({
  component: TriviaPage,
  head: () => ({
    meta: [
      { title: "Ritual Trivia — Are you a real Ritualist?" },
      {
        name: "description",
        content:
          "10 questions about the Ritual ecosystem. Test your knowledge and share your score.",
      },
    ],
  }),
});

type Q = { q: string; options: string[]; answer: number };

const QUESTIONS: Q[] = [
  {
    q: "How many native precompiles does Ritual Chain have?",
    options: ["8", "12", "16", "24"],
    answer: 2,
  },
  {
    q: "What is Ritual's flagship product?",
    options: ["Infernet", "Oracle", "Ritualnet", "ChainAI"],
    answer: 0,
  },
  {
    q: "How much did Ritual raise in their Series A?",
    options: ["$10 million", "$15 million", "$25 million", "$50 million"],
    answer: 2,
  },
  {
    q: "What year was Infernet launched?",
    options: ["2021", "2022", "2023", "2024"],
    answer: 2,
  },
  {
    q: "What VM does Ritual Chain use?",
    options: ["EVM", "EVM++ (TEE-EOVMT)", "WASM", "SVM"],
    answer: 1,
  },
  {
    q: "What does TEE stand for?",
    options: [
      "Token Execution Engine",
      "Trusted Execution Environment",
      "Throughput Edge Engine",
      "Token Encryption Element",
    ],
    answer: 1,
  },
  {
    q: "What is the Ritual Chain ID?",
    options: ["1979", "1971", "1997", "2024"],
    answer: 0,
  },
  {
    q: "What token is used on Ritual Chain?",
    options: ["RTL", "INFER", "RITUAL", "ETH"],
    answer: 2,
  },
  {
    q: "What replaces Infernet on Ritual Chain?",
    options: ["Oracles", "Native precompiles", "Sidechains", "Rollups"],
    answer: 1,
  },
  {
    q: "Who are Ritual's investors?",
    options: [
      "a16z, Sequoia, Paradigm",
      "Archetype, Accel, Robot Ventures, Polychain",
      "Coinbase Ventures, Multicoin",
      "Binance Labs, OKX",
    ],
    answer: 1,
  },
];

function TriviaPage() {
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [xHandle, setXHandle] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { account } = useWallet();

  useEffect(() => {
    if (!account) return;
    fetchHandle(account).then((h) => setXHandle(h ?? null));
  }, [account]);

  const done = step >= QUESTIONS.length;
  const score = picks.reduce(
    (s, p, i) => (p === QUESTIONS[i].answer ? s + 1 : s),
    0,
  );
  const seed = `trivia-${score}-${picks.join("")}`;

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    setTimeout(() => {
      setPicks((p) => [...p, i]);
      setPicked(null);
      setStep((s) => s + 1);
    }, 700);
  }

  function reset() {
    setStep(0);
    setPicks([]);
    setPicked(null);
  }

  async function downloadPng() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 2,
      backgroundColor: "#0d1714",
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ritual-trivia-${score}.png`;
    a.click();
  }

  function shareX() {
    const text = `I scored ${score}/10 on Ritual Trivia! Are you a real Ritualist? 🧠`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" position="top-center" richColors />
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 text-center">
          <p className="mb-2 inline-block rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-accent">
            Ritual Trivia
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Are you a real <span className="text-accent">Ritualist?</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            10 questions on the Ritual ecosystem.
          </p>
        </div>

        {!done ? (
          <div
            className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Question {step + 1} / {QUESTIONS.length}
              </span>
              <span>Score: {score}</span>
            </div>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(step / QUESTIONS.length) * 100}%` }}
              />
            </div>

            <h3 className="mb-5 flex items-start gap-2 text-lg font-semibold">
              <Brain className="mt-1 h-5 w-5 shrink-0 text-accent" />
              {QUESTIONS[step].q}
            </h3>

            <div className="space-y-2">
              {QUESTIONS[step].options.map((opt, i) => {
                const isPicked = picked === i;
                const isCorrect = QUESTIONS[step].answer === i;
                const reveal = picked !== null;
                let cls =
                  "w-full rounded-lg border border-border bg-background/40 px-4 py-3 text-left text-sm transition-colors hover:border-primary/60 hover:bg-primary/10";
                if (reveal && isCorrect)
                  cls += " !border-accent !bg-primary/20 text-accent";
                else if (reveal && isPicked && !isCorrect)
                  cls += " !border-destructive/60 !bg-destructive/10";
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={picked !== null}
                    className={cls}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span>{opt}</span>
                      {reveal && isCorrect && <Check className="h-4 w-4" />}
                      {reveal && isPicked && !isCorrect && (
                        <X className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              ref={cardRef}
              className="relative overflow-hidden rounded-2xl p-6 text-center"
              style={{
                background: "var(--gradient-bg)",
                boxShadow: "var(--shadow-glow)",
                border: "1px solid oklch(0.4 0.1 150)",
              }}
            >
              <div className="absolute inset-0 opacity-10 [background:radial-gradient(circle_at_30%_20%,oklch(0.7_0.2_150),transparent_60%)]" />
              <div className="relative">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Ritual Trivia
                </p>
                <img
                  src={xHandle ? xAvatarUrl(xHandle) : avatarUrl(seed)}
                  alt=""
                  className="mx-auto mt-3 h-24 w-24 rounded-xl border-2 border-primary bg-card"
                />
                <h3 className="mt-4 text-2xl font-bold tracking-tight text-accent">
                  {score}/10
                </h3>
                <p className="mt-2 text-sm text-foreground/90">
                  {score === 10
                    ? "Untouchable. You ARE the Ritual."
                    : score >= 7
                      ? "Real Ritualist confirmed."
                      : score >= 4
                        ? "Apprentice Ritualist. Read the docs ✨"
                        : "Ritual newcomer. Welcome 🜂"}
                </p>
                <p className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
                  ritual.tip / feed
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button onClick={reset} variant="secondary">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button onClick={downloadPng} variant="secondary">
                <Download className="mr-2 h-4 w-4" />
                PNG
              </Button>
              <Button onClick={shareX}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}