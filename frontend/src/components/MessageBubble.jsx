import StreamingText from "./StreamingText.jsx";

export default function MessageBubble({ message, streaming = false }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"} animate-fadeInUp`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center mt-1">
          <span className="text-xs font-bold text-background font-heading">L</span>
        </div>
      )}

      <div className={`flex flex-col max-w-[72%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Label */}
        <span className="text-xs text-textMuted mb-1 px-1">
          {isUser ? "you said" : "Lingua said"}
        </span>

        {/* Bubble */}
        <div
          className={`
            px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${
              isUser
                ? "bg-surfaceHover text-textPrimary rounded-tr-sm border border-border animate-fadeInRight"
                : "bg-surface text-textPrimary rounded-tl-sm border border-border animate-fadeInLeft"
            }
          `}
        >
          {!isUser ? (
            <StreamingText text={message.content} streaming={streaming} />
          ) : (
            <span>{message.content}</span>
          )}
        </div>

        {/* Timestamp */}
        {message.created_at && (
          <span className="text-xs text-textMuted mt-1 px-1">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
