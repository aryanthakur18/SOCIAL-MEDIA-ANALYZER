# Social Media Content Analyzer

Upload a PDF or a screenshot of a social post, get the text back with its formatting intact, and
get a scored, actionable critique of how the copy will perform.

## Features

- **Document upload** — drag-and-drop or file picker, PDF + PNG/JPG/WEBP/TIFF, 20 MB limit.
- **PDF parsing** — `pdf.js` text extraction that regroups text items by their position so lines
  and paragraphs survive.
- **OCR** — `tesseract.js` runs Tesseract in a Web Worker for scanned/screenshot images, with live
  progress.
- **Engagement analysis** — a 0-100 score across eight weighted checks: length, hook, call to
  action, hashtags, interaction triggers, readability (Flesch), structure and emoji usage.
- **Live editing** — the extracted text is editable and the analysis recomputes as you type.
- **Hashtag ideas** generated from the post's most distinctive terms.
- Loading states, inline error handling, keyboard/ARIA-friendly UI.

## Approach (write-up)

The whole pipeline runs client-side, which keeps it fast, private and free to host. Extraction is
split by file type: PDFs go through `pdf.js`, where raw text items are bucketed by their `y`
transform and sorted by `x` so the output preserves line and paragraph breaks rather than
collapsing to a blob; images go through `tesseract.js`, whose logger drives a real progress bar
because OCR takes seconds, not milliseconds.

Analysis is deliberately deterministic rather than an LLM call: every rule is a pure function with
an explicit point weight, so the score is explainable and reproducible, and the user sees exactly
which check cost them points. Rules encode widely published copy heuristics — a hook under ~12
words that survives the "see more" fold, one clear CTA, 3-5 specific hashtags, short sentences, a
question to prompt replies.

Both heavy libraries are dynamically imported behind `ClientOnly` so server rendering stays clean
and the initial payload small. Errors are handled per failure mode (unsupported type, oversized
file, image-only PDF, unreadable OCR) with a message that tells the user what to do next.

## Tech

TanStack Start (React 19, Vite 7), Tailwind CSS v4, shadcn/ui, pdf.js, tesseract.js.

## Local development

```bash
bun install
bun run dev
```

## Project structure

```
src/lib/extract.ts               PDF parsing + OCR
src/lib/analyze.ts               Scoring rules (pure, testable)
src/components/analyzer/         Upload zone, score dial, results
src/routes/index.tsx             Page shell + SEO head
```
