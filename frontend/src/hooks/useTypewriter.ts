'use client';

import { useState, useEffect, useRef } from 'react';

const CHARS_PER_SECOND = 42;
const INTERVAL_MS = 1000 / CHARS_PER_SECOND;

/**
 * Reveals `fullText` character-by-character at a human-readable pace.
 * While `isStreaming` is true new content keeps arriving;
 * once streaming stops and all text is revealed, `isDone` flips to true.
 */
export function useTypewriter(fullText: string, isStreaming: boolean) {
  const [revealed, setRevealed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef = useRef(fullText.length);

  // Keep target in sync with incoming text (in an effect, not during render)
  useEffect(() => {
    targetRef.current = fullText.length;
  }, [fullText.length]);

  useEffect(() => {
    // Already fully revealed — nothing to do
    if (revealed >= targetRef.current && !isStreaming) return;

    timerRef.current = setInterval(() => {
      setRevealed((prev) => {
        const target = targetRef.current;
        if (prev >= target) {
          // Caught up — if no longer streaming, stop ticking
          if (!isStreaming && timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return prev;
        }
        // Reveal in bursts of 1–3 characters to feel natural
        const burst = Math.min(2, target - prev);
        return prev + burst;
      });
    }, INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isStreaming, fullText.length, revealed]);

  const visibleText = fullText.slice(0, revealed);
  const isDone = !isStreaming && revealed >= fullText.length;

  return { visibleText, isDone };
}
