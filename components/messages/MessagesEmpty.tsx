"use client";

interface MessagesEmptyProps {
  onNewConversation: () => void;
}

export default function MessagesEmpty({
  onNewConversation,
}: MessagesEmptyProps) {
  return (
    <div className="grow flex flex-col items-center justify-center bg-gray-950">
      <div className="text-center max-w-sm mx-auto px-4">
        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
          <svg
            className="w-8 h-8 text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>

        {/* Text */}
        <h3 className="text-lg font-semibold text-gray-100 mb-2">
          Select a conversation
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Choose from your existing conversations or start a new one to begin
          messaging
        </p>

        {/* Action */}
        <button
          onClick={onNewConversation}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Conversation
        </button>
      </div>
    </div>
  );
}
