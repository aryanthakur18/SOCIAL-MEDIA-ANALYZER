import { AlertTriangle, Check, Copy, X } from "lucide-react";
import { useState } from "react";
import type { Analysis } from "@/lib/analyze";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreDial } from "./ScoreDial";

const icons = {
  good: Check,
  warn: AlertTriangle,
  bad: X,
} as const;

const tones = {
  good: "text-success",
  warn: "text-warning",
  bad: "text-destructive",
} as const;

export function Results({
  analysis,
  text,
  onTextChange,
  meta,
}: {
  analysis: Analysis;
  text: string;
  onTextChange: (value: string) => void;
  meta: string;
}) {
  const [copied, setCopied] = useState(false);
  const { stats } = analysis;

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <section className="panel flex flex-col gap-4 p-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Extracted text</h2>
            <p className="text-xs text-muted-foreground">{meta} · editable, analysis updates live</p>
          </div>
          <Button variant="outline" size="sm" onClick={copy}>
            <Copy className="size-3.5" aria-hidden />
            {copied ? "Copied" : "Copy"}
          </Button>
        </header>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          spellCheck={false}
          aria-label="Extracted post text"
          className="min-h-72 w-full resize-y rounded-lg border border-border bg-secondary/40 p-4 font-mono text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Words", stats.words],
            ["Characters", stats.characters],
            ["Sentences", stats.sentences],
            ["Read time", `${stats.readingSeconds}s`],
            ["Readability", stats.readability],
            ["Hashtags", stats.hashtags.length],
            ["Emoji", stats.emojis],
            ["Tone", stats.sentiment],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-border bg-background p-3">
              <dt className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-display text-lg font-semibold capitalize tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-6">
        <div className="panel p-6">
          <ScoreDial score={analysis.score} grade={analysis.grade} />
        </div>

        <div className="panel p-6">
          <h2 className="text-lg font-semibold">Improvements</h2>
          <ul className="mt-4 space-y-3">
            {analysis.suggestions.map((s) => {
              const Icon = icons[s.severity];
              return (
                <li key={s.id} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                  <Icon className={`mt-0.5 size-4 shrink-0 ${tones[s.severity]}`} aria-hidden />
                  <div>
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.detail}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                    {s.impact}/{s.max}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {analysis.hashtagIdeas.length > 0 && (
          <div className="panel p-6">
            <h2 className="text-lg font-semibold">Hashtag ideas</h2>
            <p className="text-xs text-muted-foreground">Pulled from the most distinctive words in your post.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {analysis.hashtagIdeas.map((h) => (
                <Badge key={h} variant="secondary" className="text-sm">
                  {h}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
