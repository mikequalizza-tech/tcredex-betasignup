'use client';

import MessagesHeader from './MessagesHeader';
import MessagesChat from './MessagesChat';
import MessagesFooter from './MessagesFooter';

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

interface Conversation {
  id: string;
  name: string;
  deal_name?: string;
  participants: {
    user_id: string;
    name: string;
    organization: string;
    role: string;
  }[];
}

interface MessagesBodyProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string | null;
  onSendMessage: (content: string) => void;
  sending: boolean;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function MessagesBody({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  sending,
  onToggleSidebar,
  sidebarOpen,
}: MessagesBodyProps) {
  return (
    <div className="grow flex flex-col md:translate-x-0 transition-transform duration-300 ease-in-out">
      <MessagesHeader
        conversation={conversation}
        onToggleSidebar={onToggleSidebar}
        sidebarOpen={sidebarOpen}
      />
      <MessagesChat messages={messages} currentUserId={currentUserId} />
      <MessagesFooter onSendMessage={onSendMessage} sending={sending} />
    </div>
  );
}
