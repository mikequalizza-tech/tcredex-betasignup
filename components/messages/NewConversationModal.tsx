'use client';

import { useState } from 'react';

interface Contact {
  id: string;
  name: string;
  organization: string;
  role: string;
  org_type: string;
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  categoryName: string;
  onStartConversation: (contactIds: string[]) => void;
  loading?: boolean;
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

export default function NewConversationModal({
  isOpen,
  onClose,
  contacts,
  categoryName,
  onStartConversation,
  loading,
}: NewConversationModalProps) {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleContact = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleStart = () => {
    if (selectedContacts.length > 0) {
      onStartConversation(selectedContacts);
      setSelectedContacts([]);
      setSearchQuery('');
    }
  };

  const handleClose = () => {
    setSelectedContacts([]);
    setSearchQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl w-full max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            New Conversation
          </h3>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Select contacts to start a {categoryName} conversation
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-transparent rounded-lg text-sm focus:bg-white dark:focus:bg-gray-800 focus:border-violet-500 dark:focus:border-violet-500"
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Contact list */}
          <div className="max-h-64 overflow-y-auto -mx-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
                {contacts.length === 0 ? 'No contacts available' : 'No contacts match your search'}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedContacts.includes(contact.id);
                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleToggleContact(contact.id)}
                      className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-violet-500 border-violet-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                          </svg>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-3 shrink-0">
                        {getInitials(contact.name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {contact.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {contact.organization}
                        </p>
                      </div>

                      {/* Role badge */}
                      <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                        {contact.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={selectedContacts.length === 0}
            className="flex-1 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            Start Chat {selectedContacts.length > 0 && `(${selectedContacts.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
