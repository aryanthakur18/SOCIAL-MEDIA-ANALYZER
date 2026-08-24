import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const Analyzer = lazy(() =>
  import("@/components/analyzer/Analyzer").then((m) => ({ default: m.Analyzer })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Social Media Content Analyzer — score posts from PDFs & screenshots" },
      {
        name: "description",
        content:
          "Upload a PDF or screenshot, extract the text with PDF parsing or in-browser OCR, and get an engagement score with concrete fixes for hook, CTA, hashtags and readability.",
      },
      { property: "og:title", content: "Social Media Content Analyzer" },
      {
        property: "og:description",
        content:
          "Extract post text from PDFs and images, then get an engagement score with actionable improvements — all in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen">
      <header className="hero-surface border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
          <p className="inline-flex items-center rounded-full border border-border bg-card/70 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            PDF parsing · OCR · engagement scoring
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.05] sm:text-6xl">
            Read your post the way the feed will.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Drop in a PDF or a screenshot. The text comes out with its formatting intact, and every
            line gets checked against what actually earns comments, saves and shares.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
        <ClientOnly
          fallback={
            <div className="panel h-64 animate-pulse" aria-hidden />
          }
        >
          <Suspense fallback={<div className="panel h-64 animate-pulse" aria-hidden />}>
            <Analyzer />
          </Suspense>
        </ClientOnly>
      </div>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-8 text-sm text-muted-foreground">
          <p>Everything runs locally in your browser — no file ever leaves your device.</p>
          <p>Built with TanStack Start, pdf.js and Tesseract.js.</p>
        </div>
      </footer>
    </main>
  );
}
