'use client';

import { useState } from 'react';

export default function BetaSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/beta/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setName('');
        setEmail('');
      } else if (response.status === 409) {
        setStatus('duplicate');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  return (
    <section className="relative" id="beta-signup">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-gradient-to-r before:from-transparent before:to-indigo-200/50 after:h-px after:w-8 after:bg-gradient-to-l after:from-transparent after:to-indigo-200/50">
              <span className="inline-flex bg-gradient-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
                Early Access
              </span>
            </div>
            <h2
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl"
              data-aos="fade-up"
            >
              Join the Beta — Launching Soon
            </h2>
            <p className="text-lg text-indigo-200/65 mb-8" data-aos="fade-up" data-aos-delay={200}>
              Be the first to access the AI-powered tax credit marketplace.
              Sign up now and get early access when we launch.
            </p>

            {status === 'success' ? (
              <div className="max-w-md mx-auto p-6 rounded-xl bg-green-900/30 border border-green-500/50" data-aos="zoom-y-out">
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-green-300 font-semibold text-lg">You&apos;re on the list!</p>
                <p className="text-gray-400 text-sm mt-1">We&apos;ll notify you when tCredex launches.</p>
              </div>
            ) : status === 'duplicate' ? (
              <div className="max-w-md mx-auto p-6 rounded-xl bg-indigo-900/30 border border-indigo-500/50" data-aos="zoom-y-out">
                <div className="text-3xl mb-2">👋</div>
                <p className="text-indigo-300 font-semibold text-lg">You&apos;re already on the list!</p>
                <p className="text-gray-400 text-sm mt-1">We&apos;ll be in touch when the beta is ready.</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="max-w-md mx-auto space-y-4"
                data-aos="fade-up"
                data-aos-delay={300}
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  {status === 'loading' ? 'Signing up...' : 'Sign Up for Beta'}
                </button>
                {status === 'error' && (
                  <p className="text-red-400 text-sm">{errorMessage}</p>
                )}
                <p className="text-xs text-gray-500">No spam. We&apos;ll only email you about the launch.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
