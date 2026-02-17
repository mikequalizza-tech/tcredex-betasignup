'use client';

import { useState, KeyboardEvent } from 'react';

interface MessagesFooterProps {
  onSendMessage: (content: string) => void;
  sending: boolean;
  disabled?: boolean;
}

export default function MessagesFooter({ onSendMessage, sending, disabled }: MessagesFooterProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sending && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="sticky bottom-0">
      <div className="flex items-center justify-between bg-gray-900 border-t border-gray-800 px-4 sm:px-6 md:px-5 h-16">
        {/* Attachment button */}
        <button
          type="button"
          className="shrink-0 text-gray-500 hover:text-gray-400 mr-3 transition-colors"
          disabled={disabled}
        >
          <span className="sr-only">Add attachment</span>
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12C23.98 5.38 18.62.02 12 0zm6 13h-5v5h-2v-5H6v-2h5V6h2v5h5v2z" />
          </svg>
        </button>

        {/* Message input */}
        <form className="grow flex" onSubmit={handleSubmit}>
          <div className="grow mr-3">
            <label htmlFor="message-input" className="sr-only">Type a message</label>
            <input
              id="message-input"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={disabled || sending}
              className="form-input w-full bg-gray-800 border-gray-700 focus:bg-gray-800 focus:border-indigo-500 placeholder-gray-500 text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim() || sending || disabled}
            className="btn bg-indigo-600 hover:bg-indigo-500 text-white whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <svg className="w-4 h-4 fill-current rotate-90" viewBox="0 0 16 16">
                  <path d="M15 7V1h-6l2.146 2.146L5.146 9.146l1.414 1.414 6-6z" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
