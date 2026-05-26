"use client";

import { useEffect, type RefObject } from "react";

export function useSearchShortcut(inputRef: RefObject<HTMLInputElement | null>, clearSearch: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (event.key === "Escape") {
        clearSearch();
        inputRef.current?.blur();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearSearch, inputRef]);
}
