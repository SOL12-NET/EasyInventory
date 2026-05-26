import { normalizeSearchText } from "./inventory";

export type HighlightPart = {
  id: string;
  text: string;
  match: boolean;
};

export function splitHighlightedText(text: string | null | undefined, query: string): HighlightPart[] {
  const source = String(text ?? "");
  const needle = normalizeSearchText(query);
  if (!source || !needle) return [{ id: "0", text: source, match: false }];

  const normalizedSource = normalizeSearchText(source);
  const index = normalizedSource.indexOf(needle);
  if (index === -1) return [{ id: "0", text: source, match: false }];

  const before = source.slice(0, index);
  const match = source.slice(index, index + needle.length);
  const after = source.slice(index + needle.length);

  return [
    { id: "before", text: before, match: false },
    { id: "match", text: match, match: true },
    { id: "after", text: after, match: false },
  ].filter((part) => part.text.length > 0);
}
