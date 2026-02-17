'use client';

interface Participant {
  user_id: string;
  name: string;
  organization: string;
  role: string;
}

interface Conversation {
  id: string;
  name: string;
  deal_name?: string;
  participants: Participant[];
}

interface MessagesHeaderProps {
  conversation: Conversation;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
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

export default function MessagesHeader({
  conversation,
  onToggleSidebar,
  sidebarOpen,
}: MessagesHeaderProps) {
  return (
    <div className="sticky top-16 z-10">
      <div className="flex items-center justify-between bg-gray-900 border-b border-gray-800 px-4 sm:px-6 md:px-5 h-16">
        {/* Left side - Back button and participants */}
        <div className="flex items-center">
          {/* Back button (mobile) */}
          <button
            className="md:hidden text-gray-400 hover:text-gray-300 mr-4"
            onClick={onToggleSidebar}
            aria-controls="messages-sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Toggle sidebar</span>
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
            </svg>
          </button>

          {/* Participant avatars */}
          <div className="flex -space-x-3 -ml-px">
            {conversation.participants.slice(0, 3).map((participant) => (
              <div
                key={participant.user_id}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border-2 border-gray-900 box-content"
                title={participant.name}
              >
                {getInitials(participant.name)}
              </div>
            ))}
            {conversation.participants.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300 border-2 border-gray-900 box-content">
                +{conversation.participants.length - 3}
              </div>
            )}
          </div>

          {/* Conversation info */}
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-gray-100">
              {conversation.name}
            </h3>
            <p className="text-xs text-gray-400">
              {conversation.participants.length} participant{conversation.participants.length !== 1 ? 's' : ''}
              {conversation.deal_name && ` - ${conversation.deal_name}`}
            </p>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          <button className="p-1.5 shrink-0 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V4h2v5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
