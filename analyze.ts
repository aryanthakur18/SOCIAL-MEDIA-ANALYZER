/**
 * Heuristic engagement analyzer. Pure functions, no side effects, unit-testable.
 * Rules are derived from widely published social-copy best practices:
 * length windows, hashtag counts, CTAs, questions, readability, scannability.
 */

export type Severity = "good" | "warn" | "bad";

export interface Suggestion {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
  impact: number; // points contributed out of `max`
  max: number;
}

export interface Analysis {
  score: number;
  grade: string;
  stats: {
    words: number;
    characters: number;
    sentences: number;
    readingSeconds: number;
    hashtags: string[];
    mentions: string[];
    links: number;
    emojis: number;
    questions: number;
    avgSentenceWords: number;
    readability: number;
    sentiment: "positive" | "neutral" | "negative";
  };
  suggestions: Suggestion[];
  hashtagIdeas: string[];
}

const CTA_PATTERNS = [
  "comment",
  "share",
  "follow",
  "subscribe",
  "sign up",
  "signup",
  "join",
  "download",
  "learn more",
  "read more",
  "check out",
  "tell me",
  "let me know",
  "dm ",
  "link in bio",
  "save this",
  "tag a",
  "try it",
  "register",
  "book",
];

const POSITIVE = [
  "love","great","amazing","best","win","happy","excited","proud","launch","free","boost","growth","easy","powerful","new","huge","success","thanks","grateful","awesome",
];
const NEGATIVE = [
  "hate","bad","worst","fail","problem","issue","boring","hard","difficult","never","angry","sad","broken","confusing","risk","loss","stuck",
];

const STOPWORDS = new Set([
  "the","and","for","with","that","this","from","your","you","are","was","were","have","has","had","not","but","all","can","will","just","its","it's","our","their","they","them","about","into","when","what","how","why","who","more","most","also","than","then","some","such","very","been","being","over","after","before","because","while","there","here","would","could","should","得",
]);

export function analyze(raw: string): Analysis {
  const text = raw.trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const sentences = text.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 1);
  const hashtags = [...new Set(text.match(/#[\p{L}\p{N}_]+/gu) ?? [])];
  const mentions = [...new Set(text.match(/@[\p{L}\p{N}_.]+/gu) ?? [])];
  const links = (text.match(/https?:\/\/\S+|\bwww\.\S+/gi) ?? []).length;
  const emojis = (text.match(/\p{Extended_Pictographic}/gu) ?? []).length;
  const questions = (text.match(/\?/g) ?? []).length;
  const lower = text.toLowerCase();

  const syllables = words.reduce((n, w) => n + countSyllables(w), 0);
  const avgSentenceWords = sentences.length ? words.length / sentences.length : words.length;
  const readability = words.length
    ? clamp(
        206.835 - 1.015 * avgSentenceWords - 84.6 * (syllables / Math.max(words.length, 1)),
        0,
        100,
      )
    : 0;

  const pos = POSITIVE.filter((w) => lower.includes(w)).length;
  const neg = NEGATIVE.filter((w) => lower.includes(w)).length;
  const sentiment = pos > neg ? "positive" : neg > pos ? "negative" : "neutral";

  const suggestions: Suggestion[] = [];
  const add = (s: Suggestion) => suggestions.push(s);

  // 1. Length
  const len = words.length;
  add(
    len === 0
      ? bad("length", "No text detected", "Upload a document with readable copy, or paste text manually.", 20)
      : len < 12
        ? warn("length", "Post is very short", `${len} words gives the algorithm little to work with. Aim for 25-60 words for feed posts.`, 8, 20)
        : len > 150
          ? warn("length", "Post is long", `${len} words. Trim to under ~120 words, or move detail to a comment or thread.`, 12, 20)
          : good("length", "Length is in the sweet spot", `${len} words reads comfortably in a feed.`, 20),
  );

  // 2. Hook
  const firstLine = (text.split(/\n/)[0] ?? "").trim();
  const hookWords = firstLine.split(/\s+/).filter(Boolean).length;
  add(
    !firstLine
      ? bad("hook", "No opening hook", "Start with a one-line hook: a bold claim, a number, or a question.", 15)
      : hookWords > 18
        ? warn("hook", "Hook is buried", `Your first line is ${hookWords} words. Cut it to under 12 so it survives the "see more" fold.`, 7, 15)
        : /^(hi|hello|hey|dear|greetings)\b/i.test(firstLine)
          ? warn("hook", "Generic greeting opener", "Openers like \"Hi everyone\" waste the most valuable line. Lead with the payoff.", 8, 15)
          : good("hook", "Strong, tight opening line", `"${truncate(firstLine, 60)}" lands before the fold.`, 15),
  );

  // 3. CTA
  const cta = CTA_PATTERNS.find((p) => lower.includes(p));
  add(
    cta
      ? good("cta", "Clear call to action", `Detected "${cta.trim()}" — readers know what to do next.`, 15)
      : bad("cta", "No call to action", "Close with one ask: a question, \"save this\", or \"tell me in the comments\".", 15),
  );

  // 4. Hashtags
  add(
    hashtags.length === 0
      ? warn("hashtags", "No hashtags", "Add 3-5 specific, topical hashtags to reach beyond your followers.", 4, 12)
      : hashtags.length > 8
        ? warn("hashtags", "Too many hashtags", `${hashtags.length} hashtags reads as spam. Keep the 3-5 most specific.`, 5, 12)
        : good("hashtags", "Healthy hashtag count", `${hashtags.length} hashtags: ${hashtags.slice(0, 5).join(" ")}`, 12),
  );

  // 5. Engagement trigger (question / mention)
  add(
    questions > 0 || mentions.length > 0
      ? good("interaction", "Invites interaction", questions > 0 ? "A question in the copy reliably lifts comments." : `Mentions (${mentions.slice(0, 3).join(", ")}) pull in other accounts.`, 12)
      : warn("interaction", "Nothing to reply to", "Ask one direct question, or tag a relevant person or brand.", 3, 12),
  );

  // 6. Readability
  add(
    readability >= 60
      ? good("readability", "Easy to read", `Flesch score ${readability.toFixed(0)} — plain and scannable.`, 12)
      : readability >= 40
        ? warn("readability", "Fairly dense", `Flesch score ${readability.toFixed(0)}. Shorten sentences (currently ~${avgSentenceWords.toFixed(0)} words) and cut jargon.`, 6, 12)
        : warn("readability", "Hard to read", `Flesch score ${readability.toFixed(0)}. Break long sentences into one idea each.`, 2, 12),
  );

  // 7. Scannability / emoji & structure
  const lineCount = text.split(/\n/).filter((l) => l.trim()).length;
  add(
    len > 40 && lineCount < 3
      ? warn("structure", "One dense block", "Split into short lines or bullets with blank lines between them.", 3, 8)
      : good("structure", "Well-structured layout", `${lineCount} line${lineCount === 1 ? "" : "s"} with visual breathing room.`, 8),
  );

  add(
    emojis === 0
      ? warn("emoji", "No emoji", "One or two relevant emoji add colour and stop the scroll. Don't overdo it.", 2, 6)
      : emojis > 12
        ? warn("emoji", "Emoji overload", `${emojis} emoji compete with your message. Keep 2-4.`, 2, 6)
        : good("emoji", "Tasteful emoji use", `${emojis} emoji support the tone.`, 6),
  );

  const score = Math.round(
    (suggestions.reduce((n, s) => n + s.impact, 0) / suggestions.reduce((n, s) => n + s.max, 0)) * 100,
  );

  return {
    score: Number.isFinite(score) ? score : 0,
    grade: gradeFor(score),
    stats: {
      words: len,
      characters: text.length,
      sentences: sentences.length,
      readingSeconds: Math.max(1, Math.round((len / 220) * 60)),
      hashtags,
      mentions,
      links,
      emojis,
      questions,
      avgSentenceWords: Number(avgSentenceWords.toFixed(1)),
      readability: Number(readability.toFixed(0)),
      sentiment,
    },
    suggestions,
    hashtagIdeas: keywordIdeas(words, hashtags),
  };
}

function keywordIdeas(words: string[], existing: string[]) {
  const have = new Set(existing.map((h) => h.slice(1).toLowerCase()));
  const counts = new Map<string, number>();
  for (const w of words) {
    const k = w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    if (k.length < 5 || STOPWORDS.has(k) || have.has(k)) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([k]) => `#${k}`);
}

function countSyllables(word: string) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function gradeFor(score: number) {
  if (score >= 85) return "Ready to post";
  if (score >= 70) return "Solid, minor tweaks";
  if (score >= 50) return "Needs work";
  return "Rewrite recommended";
}

const good = (id: string, title: string, detail: string, max: number): Suggestion => ({ id, title, detail, severity: "good", impact: max, max });
const warn = (id: string, title: string, detail: string, impact: number, max: number): Suggestion => ({ id, title, detail, severity: "warn", impact, max });
const bad = (id: string, title: string, detail: string, max: number): Suggestion => ({ id, title, detail, severity: "bad", impact: 0, max });
