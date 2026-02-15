"use client";

import Link from "next/link";
import Logo from "./logo";

export default function Footer() {
  return (
    <footer>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-8 md:py-12">
          {/* Logo and tagline */}
          <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Logo size="md" />
            <p className="text-sm text-gray-400 max-w-xs">
              The AI-powered tax credit marketplace. Beta coming soon.
            </p>
          </div>

          {/* Footer content */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Programs */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">Programs</div>
              <ul className="space-y-2 text-sm text-indigo-200/65">
                <li><span className="transition hover:text-gray-200">NMTC</span></li>
                <li><span className="transition hover:text-gray-200">LIHTC</span></li>
                <li><span className="transition hover:text-gray-200">HTC</span></li>
                <li><span className="transition hover:text-gray-200">Opportunity Zones</span></li>
                <li><span className="transition hover:text-gray-200">Brownfield</span></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">Company</div>
              <ul className="space-y-2 text-sm text-indigo-200/65">
                <li>
                  <Link href="/about" className="transition hover:text-gray-200">About tCredex</Link>
                </li>
                <li>
                  <Link href="/blog" className="transition hover:text-gray-200">Blog</Link>
                </li>
                <li>
                  <Link href="/help" className="transition hover:text-gray-200">Help</Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">Resources</div>
              <ul className="space-y-2 text-sm text-indigo-200/65">
                <li>
                  <Link href="/#address-lookup" className="transition hover:text-gray-200">Census Tract Lookup</Link>
                </li>
                <li>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openChatTC'))}
                    className="transition hover:text-gray-200"
                  >
                    Ask ChatTC
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">Legal</div>
              <ul className="space-y-2 text-sm text-indigo-200/65">
                <li><span className="transition hover:text-gray-200">Terms of Service</span></li>
                <li><span className="transition hover:text-gray-200">Privacy Policy</span></li>
              </ul>
              <div className="mt-6 text-sm text-indigo-200/65 space-y-2">
                <p>&copy; {new Date().getFullYear()} tCredex</p>
                <p className="text-xs text-gray-500">
                  An affiliate of American Impact Ventures LLC
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="mt-8 pt-8 border-t border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>Have questions?</span>
                <Link href="/help" className="text-indigo-400 hover:text-indigo-300 transition">
                  Help Center
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openChatTC'))}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Ask ChatTC
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
