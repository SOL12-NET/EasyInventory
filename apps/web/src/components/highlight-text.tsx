import { splitHighlightedText } from "@/lib/highlight";

export function HighlightText({ text, query }: { text: string | null | undefined; query: string }) {
  return (
    <>
      {splitHighlightedText(text, query).map((part) =>
        part.match ? (
          <mark key={part.id} className="highlight-mark">
            {part.text}
          </mark>
        ) : (
          <span key={part.id}>{part.text}</span>
        ),
      )}
    </>
  );
}
