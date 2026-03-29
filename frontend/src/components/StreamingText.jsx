import { useEffect, useState, useRef } from "react";

const CORRECTION_RE = /In \w+ we'?d? say:?/gi;

function highlightCorrections(text) {
  // Split text on correction patterns and wrap the correction phrase + following content in amber
  const parts = [];
  let lastIndex = 0;
  const regex = /(In \w+ we'?d? say[^.!?]*[.!?])/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>
      );
    }
    parts.push(
      <span key={match.index} className="text-accentLight font-medium">
        {match[0]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
}

export default function StreamingText({ text, streaming = false }) {
  const [displayedWords, setDisplayedWords] = useState([]);
  const prevTextRef = useRef("");

  useEffect(() => {
    if (!streaming) {
      // Static — just show all at once
      setDisplayedWords(text ? text.split(" ") : []);
      prevTextRef.current = text || "";
      return;
    }

    const newPart = text.slice(prevTextRef.current.length);
    if (!newPart) return;

    prevTextRef.current = text;

    // Split the new chunk into words and append them
    const newWords = newPart.split(/(?<=\s)|(?=\s)/).filter(Boolean);
    setDisplayedWords((prev) => [...prev, ...newWords]);
  }, [text, streaming]);

  // Reset when text is cleared
  useEffect(() => {
    if (!text) {
      setDisplayedWords([]);
      prevTextRef.current = "";
    }
  }, [text]);

  const fullText = displayedWords.join("");

  return (
    <span className="leading-relaxed">
      {streaming
        ? displayedWords.map((word, i) => (
            <span key={i} className="animate-wordFade inline">
              {word}
            </span>
          ))
        : highlightCorrections(fullText)}
      {streaming && (
        <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse align-middle" />
      )}
    </span>
  );
}
