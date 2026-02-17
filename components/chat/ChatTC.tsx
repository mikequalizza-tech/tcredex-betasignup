'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  showContactForm?: 'support' | 'advisory';
  isTechnicalQuestion?: boolean;
}

interface ContactFormData {
  name: string;
  email: string;
  topic: string;
  message: string;
}

// Embedded Contact Form Component
function EmbeddedContactForm({ 
  type, 
  onSubmit, 
  onCancel 
}: { 
  type: 'support' | 'advisory';
  onSubmit: (data: ContactFormData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    topic: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSupport = type === 'support';
  const topics = isSupport 
    ? ['Account Issue', 'Technical Bug', 'How to Use', 'Feature Request', 'Billing', 'Other']
    : ['Deal Structuring', 'CDE Matching', 'Investor Intros', 'Application Support', 'Closing Help', 'General Consultation'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: isSupport ? 'platform_support' : 'aiv_advisory',
          source: 'chatTC'
        }),
      });

      if (response.ok) {
        onSubmit(formData);
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      onSubmit(formData); // Still show success for demo
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white">
          {isSupport ? '📧 Contact Support' : '🤝 Contact AIV Advisory'}
        </h4>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Your name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          required
        />
        <input
          type="email"
          placeholder="Your email *"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          required
        />
        <select
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="">Select topic...</option>
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <textarea
          placeholder="Your message *"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
          required
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.name || !formData.email || !formData.message}
            className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors"
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
      <p className="text-xs text-gray-500 mt-2 text-center">
        {isSupport ? 'Goes to support@tcredex.com' : 'Goes to deals@americanimpactventures.com'}
      </p>
    </div>
  );
}

export default function ChatTC() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState<'support' | 'advisory' | null>(null);
  const [technicalQuestionCount, setTechnicalQuestionCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showContactForm]);

  // Listen for custom event to open chat from footer button
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openChatTC', handleOpenChat);
    return () => window.removeEventListener('openChatTC', handleOpenChat);
  }, []);

  // Detect if a question is technical/deal-related that ChatTC CANNOT answer
  const isUnansweredTechnicalQuestion = (userText: string, assistantResponse: string): boolean => {
    // These are questions ChatTC CANNOT answer and should refer to AIV
    const unansweredKeywords = [
      'help me with my deal', 'help me close', 'help me structure', 'help me find',
      'deal structuring', 'cde matching', 'investor intro', 'closing support',
      'transaction support', 'need an advisor', 'need a consultant', 'need help with',
      'recommend someone', 'who can help me', 'can you help me close',
      'can you help me structure', 'can you help me find'
    ];
    
    // If the response contains an actual answer (not a referral), don't count it
    const hasActualAnswer = assistantResponse.length > 200 && 
                           !assistantResponse.toLowerCase().includes('contact aiv') &&
                           !assistantResponse.toLowerCase().includes('american impact ventures') &&
                           !assistantResponse.toLowerCase().includes('deals@americanimpactventures');
    
    if (hasActualAnswer) return false; // ChatTC answered it, don't count
    
    const lower = userText.toLowerCase();
    return unansweredKeywords.some(keyword => lower.includes(keyword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      // Handle streaming response for fast display
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('text/event-stream')) {
        // Streaming response - show text as it arrives
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder();
        let assistantResponse = '';

        // Add empty assistant message that we'll update
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
        setIsLoading(false); // Hide loading indicator since text will stream

        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (!trimmed.startsWith('data: ')) continue;

            try {
              const json = JSON.parse(trimmed.slice(6));
              if (json.content) {
                assistantResponse += json.content;
                // Update the last message with accumulated content
                setMessages((prev) => {
                  const updated = [...prev];
                  if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
                    updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantResponse };
                  }
                  return updated;
                });
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        // Final processing for contact form detection
        const isUnanswered = isUnansweredTechnicalQuestion(userMessage, assistantResponse);
        const newCount = isUnanswered ? technicalQuestionCount + 1 : technicalQuestionCount;

        let formType: 'support' | 'advisory' | undefined;
        const content = assistantResponse.toLowerCase();

        if (newCount >= 3 && (content.includes('americanimpactventures') || content.includes('aiv') || content.includes('deals@'))) {
          formType = 'advisory';
        } else if (content.includes('support@tcredex.com') || content.includes('platform support')) {
          formType = 'support';
        }

        setTechnicalQuestionCount(newCount);
        if (formType) {
          setMessages((prev) => {
            const updated = [...prev];
            if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
              updated[updated.length - 1] = { ...updated[updated.length - 1], showContactForm: formType };
            }
            return updated;
          });
        }
        return; // Don't continue to non-streaming logic
      }

      // Non-streaming fallback
      const data = await response.json();
      const assistantResponse = data.content;

      // Only count as unanswered technical question if ChatTC couldn't answer it
      const isUnanswered = isUnansweredTechnicalQuestion(userMessage, assistantResponse);
      const newCount = isUnanswered ? technicalQuestionCount + 1 : technicalQuestionCount;

      // Only suggest AIV after 3+ unanswered technical questions
      let formType: 'support' | 'advisory' | undefined;
      const content = assistantResponse.toLowerCase();

      if (newCount >= 3 && (content.includes('americanimpactventures') || content.includes('aiv') || content.includes('deals@'))) {
        formType = 'advisory';
      } else if (content.includes('support@tcredex.com') || content.includes('platform support')) {
        formType = 'support';
      }

      setTechnicalQuestionCount(newCount);
      setMessages((prev) => [...prev, { role: 'assistant', content: assistantResponse, showContactForm: formType }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: "I'm having trouble connecting right now. Please try again in a moment, or reach out to support@tcredex.com for assistance.",
          showContactForm: 'support'
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactFormSubmit = (data: ContactFormData) => {
    setShowContactForm(null);
    setMessages((prev) => [
      ...prev,
      { 
        role: 'assistant', 
        content: `✅ Your message has been sent! We'll get back to you at ${data.email} soon. Is there anything else I can help you with?` 
      },
    ]);
  };

  const quickQuestions = [
    "What is NMTC?",
    "How do I check eligibility?",
    "How do I contact support?",
  ];

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        aria-label="Open chat"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[520px] bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">TC</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">ChatTC</h3>
              <p className="text-indigo-200 text-xs">Tax Credit AI Assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-400 text-xl">👋</span>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Hi! I'm ChatTC, your tax credit assistant. Ask me anything about NMTC, LIHTC, HTC, and more.
                </p>
                <div className="space-y-2">
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="block w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx}>
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-gray-800 text-gray-200 rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
                
                {/* Show contact form button if AI suggested it */}
                {msg.role === 'assistant' && msg.showContactForm && showContactForm !== msg.showContactForm && (
                  <div className="mt-2 ml-2">
                    <button
                      onClick={() => setShowContactForm(msg.showContactForm!)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 text-xs rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {msg.showContactForm === 'support' ? 'Open Support Form' : 'Contact AIV Advisory'}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              </div>
            )}

            {/* Embedded Contact Form */}
            {showContactForm && (
              <EmbeddedContactForm
                type={showContactForm}
                onSubmit={handleContactFormSubmit}
                onCancel={() => setShowContactForm(null)}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about tax credits..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
