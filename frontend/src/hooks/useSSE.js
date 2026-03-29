import { useCallback, useRef } from "react";

/**
 * Hook to read an SSE stream from a fetch Response.
 * Usage:
 *   const { readStream } = useSSE();
 *   readStream(response, onChunk, onDone, onError);
 */
export default function useSSE() {
  const abortRef = useRef(null);

  const readStream = useCallback(async (response, onChunk, onDone, onError) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    abortRef.current = reader;

    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE lines are separated by \n\n
        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const block of lines) {
          for (const line of block.split("\n")) {
            if (line.startsWith("data: ")) {
              const raw = line.slice(6).trim();
              if (!raw) continue;
              try {
                const event = JSON.parse(raw);
                if (event.type === "chunk") {
                  onChunk?.(event.content);
                } else if (event.type === "done") {
                  onDone?.(event.content);
                } else if (event.type === "error") {
                  onError?.(event.content);
                }
              } catch {
                // ignore malformed events
              }
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        onError?.(err.message);
      }
    } finally {
      reader.releaseLock();
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.cancel();
  }, []);

  return { readStream, abort };
}
