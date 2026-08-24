import { useMemo, useState } from "react";
import { Loader2, RotateCcw, Sparkles } from "lucide-react";
import { analyze } from "@/lib/analyze";
import { extractText, isImage, isPdf } from "@/lib/extract";
import { Button } from "@/components/ui/button";
import { UploadZone } from "./UploadZone";
import { Results } from "./Results";

const SAMPLE = `We shipped something today 🚀

Our new analyzer reads your post before your audience does — PDF or screenshot, straight in the browser.

No sign-up. No upload to a server. Just paste, drop, improve.

What's the one post you wish you could rewrite? Tell me in the comments 👇

#buildinpublic #contentstrategy #socialmedia`;

const MAX_MB = 20;

export function Analyzer() {
  const [text, setText] = useState("");
  const [meta, setMeta] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [pct, setPct] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const analysis = useMemo(() => (text.trim() ? analyze(text) : null), [text]);

  async function handleFile(file: File) {
    setError(null);
    if (!isPdf(file) && !isImage(file)) {
      setError("Unsupported file type. Upload a PDF or an image (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please keep it under ${MAX_MB} MB.`);
      return;
    }

    setBusy(true);
    setStage(isPdf(file) ? "Parsing PDF" : "Running OCR");
    setPct(0);
    try {
      const result = await extractText(file, (s, p) => {
        setStage(s.charAt(0).toUpperCase() + s.slice(1));
        setPct(p);
      });
      if (!result.text.trim()) {
        setError(
          isPdf(file)
            ? "No selectable text in that PDF — it's likely a scan. Export the page as an image and re-upload to use OCR."
            : "OCR couldn't read that image. Try a sharper, higher-contrast screenshot.",
        );
        return;
      }
      setText(result.text);
      setMeta(
        result.kind === "pdf"
          ? `${file.name} · ${result.pages} page${result.pages === 1 ? "" : "s"} · PDF parse`
          : `${file.name} · OCR${result.confidence ? ` · ${result.confidence.toFixed(0)}% confidence` : ""}`,
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong while reading that file.");
    } finally {
      setBusy(false);
      setStage("");
      setPct(0);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {!analysis && (
        <>
          <UploadZone onFile={handleFile} disabled={busy} />
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span>or</span>
            <Button
              variant="outline"
              onClick={() => {
                setMeta("Pasted text");
                setText(" ");
              }}
              disabled={busy}
            >
              Paste text instead
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setMeta("Sample post");
                setText(SAMPLE);
              }}
              disabled={busy}
            >
              <Sparkles className="size-4" aria-hidden />
              Try a sample
            </Button>
          </div>
        </>
      )}

      {busy && (
        <div className="panel flex items-center gap-4 p-5" role="status" aria-live="polite">
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
          <div className="flex-1">
            <p className="text-sm font-medium">{stage}…</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${Math.max(pct, 6)}%` }}
              />
            </div>
          </div>
          <span className="text-sm tabular-nums text-muted-foreground">{pct}%</span>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {analysis && (
        <>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setText("");
                setMeta("");
                setError(null);
              }}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Analyze another
            </Button>
          </div>
          <Results analysis={analysis} text={text} onTextChange={setText} meta={meta} />
        </>
      )}
    </div>
  );
}
