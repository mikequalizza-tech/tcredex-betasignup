'use client';

import { useEffect, useRef } from 'react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_org: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface MessagesChatProps {
  messages: Message[];
  currentUserId: string | null;
}

// Format time helper
function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Format date for separators
function formatDateSeparator(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}

// Get initials from name
function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Check if we need a date separator
function needsDateSeparator(currentMsg: Message, prevMsg: Message | undefined) {
  if (!prevMsg) return true;
  const currentDate = new Date(currentMsg.created_at).toDateString();
  const prevDate = new Date(prevMsg.created_at).toDateString();
  return currentDate !== prevDate;
}

export default function MessagesChat({ messages, currentUserId }: MessagesChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="grow flex items-center justify-center px-4 sm:px-6 md:px-5 py-6 bg-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3 border border-gray-700">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">No messages yet</p>
          <p className="text-xs text-gray-500 mt-1">Send a message to start the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grow px-4 sm:px-6 md:px-5 py-6 overflow-y-auto bg-gray-950">
      {messages.map((message, index) => {
        const isOwn = message.sender_id === currentUserId;
        const prevMessage = messages[index - 1];
        const showDateSeparator = needsDateSeparator(message, prevMessage);

        return (
          <div key={message.id}>
            {/* Date separator */}
            {showDateSeparator && (
              <div className="flex justify-center my-5">
                <div className="inline-flex items-center justify-center text-xs text-gray-400 font-medium px-2.5 py-1 bg-gray-800 rounded-full border border-gray-700">
                  {formatDateSeparator(message.created_at)}
                </div>
              </div>
            )}

            {/* Message bubble */}
            <div className={`flex items-start mb-4 last:mb-0 ${isOwn ? 'flex-row-reverse' : ''}`}>
              {/* Avatar (only for others' messages) */}
              {!isOwn && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold mr-4 shrink-0">
                  {getInitials(message.sender_name)}
                </div>
              )}

              <div className={`max-w-[70%] ${isOwn ? 'mr-4' : ''}`}>
                {/* Sender name (only for others) */}
                {!isOwn && (
                  <div className="text-xs text-gray-400 mb-1 font-medium">
                    {message.sender_name} <span className="text-gray-500">- {message.sender_org}</span>
                  </div>
                )}

                {/* Message content */}
                <div
                  className={`text-sm p-3 rounded-lg mb-1 ${
                    isOwn
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Time and read status */}
                <div className={`flex items-center gap-1 ${isOwn ? 'justify-end' : ''}`}>
                  <span className="text-xs text-gray-500 font-medium">
                    {formatTime(message.created_at)}
                  </span>
                  {isOwn && message.is_read && (
                    <svg className="w-5 h-3 shrink-0 fill-current text-green-500" viewBox="0 0 20 12">
                      <path d="M10.402 6.988l1.586 1.586L18.28 2.28a1 1 0 011.414 1.414l-7 7a1 1 0 01-1.414 0L8.988 8.402l-2.293 2.293a1 1 0 01-1.414 0l-3-3A1 1 0 013.695 6.28l2.293 2.293L12.28 2.28a1 1 0 011.414 1.414l-3.293 3.293z" />
                    </svg>
                  )}
                  {isOwn && !message.is_read && (
                    <svg className="w-3 h-3 shrink-0 fill-current text-gray-400" viewBox="0 0 12 12">
                      <path d="M10.28 1.28L3.989 7.575 1.695 5.28A1 1 0 00.28 6.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 1.28z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} aria-hidden="true" />
    </div>
  );
}
