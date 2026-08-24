interface Props {
  score: number;
  grade: string;
}

export function ScoreDial({ score, grade }: Props) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex items-center gap-5">
      <div className="relative size-32 shrink-0">
        <svg viewBox="0 0 128 128" className="size-full -rotate-90">
          <circle cx="64" cy="64" r={radius} fill="none" strokeWidth="10" className="stroke-secondary" />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={score >= 70 ? "stroke-success" : score >= 50 ? "stroke-warning" : "stroke-destructive"}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold tabular-nums">{score}</span>
          <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Engagement score</p>
        <h3 className="mt-1 text-2xl font-semibold">{grade}</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Weighted across hook, length, call to action, hashtags, readability and structure.
        </p>
      </div>
    </div>
  );
}
