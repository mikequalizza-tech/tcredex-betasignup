"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "./logo";

export default function Footer() {
  return (
    <footer>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-8 md:py-12">
          {/* Logo and tagline */}
          <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Logo size="md" />
              <div className="h-8 w-px bg-gray-700" />
              <Image
                src="/brand/aiv-tree.png"
                alt="American Impact Ventures"
                width={40}
                height={40}
                className="opacity-70"
              />
            </div>
            <p className="text-sm text-gray-400 max-w-xs">
              No risk. You don't close, we don't get paid.
            </p>
          </div>

          {/* Footer content */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Platform Links */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">
                Platform
              </div>
              <ul className="space-y-2 text-sm text-indigo-200/65">
                <li>
                  <Link
                    href="/deals"
                    className="transition hover:text-gray-200"
                  >
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link href="/map" className="transition hover:text-gray-200">
                    Marketplace Map
                  </Link>
                </li>
                <li>
                  <Link
                    href="/automatch"
                    className="transition hover:text-gray-200"
                  >
                    AutoMatch AI
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="transition hover:text-gray-200"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Tax Credit Programs */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">
                Programs
              </div>
              <ul className="space-y-2 text-sm text-indigo-200/65">
                <li>
                  <Link
                    href="/programs/nmtc"
                    className="transition hover:text-gray-200"
                  >
                    NMTC
                  </Link>
                </li>
                <li>
                  <Link
                    href="/programs/lihtc"
                    className="transition hover:text-gray-200"
                  >
                    LIHTC
                  </Link>
                </li>
                <li>
                  <Link
                    href="/programs/htc"
                    className="transition hover:text-gray-200"
                  >
                    HTC
                  </Link>
                </li>
                <li>
                  <Link
                    href="/programs/oz"
                    className="transition hover:text-gray-200"
                  >
                    Opportunity Zones
                  </Link>
                </li>
                <li>
                  <Link
                    href="/programs/brownfield"
                    className="transition hover:text-gray-200"
                  >
                    Brownfield
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">
                Company
              </div>
              <ul className="space-y-2 text-sm text-indigo-200/65">
                <li>
                  <Link
                    href="/about"
                    className="transition hover:text-gray-200"
                  >
                    About tCredex
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="transition hover:text-gray-200"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/how-it-works"
                    className="transition hover:text-gray-200"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/who-we-serve"
                    className="transition hover:text-gray-200"
                  >
                    Who We Serve
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="transition hover:text-gray-200">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="transition hover:text-gray-200"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal & Contact */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">
                Legal
              </div>
              <ul className="space-y-2 text-sm text-indigo-200/65">
                <li>
                  <Link
                    href="/terms"
                    className="transition hover:text-gray-200"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="transition hover:text-gray-200"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>

              <div className="mt-6 text-sm text-indigo-200/65 space-y-2">
                <p>© {new Date().getFullYear()} tCredex</p>
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
                <span>Need help?</span>
                <Link
                  href="/help"
                  className="text-indigo-400 hover:text-indigo-300 transition"
                >
                  Help Center
                </Link>
                <span className="text-gray-600">|</span>
                <Link
                  href="/contact"
                  className="text-indigo-400 hover:text-indigo-300 transition"
                >
                  Contact Us
                </Link>
              </div>

              <div className="flex items-center gap-3">
                {/* Messages Button */}
                <Link
                  href="/messages"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Messages
                </Link>

                {/* ChatTC Button in Footer */}
                <button
                  onClick={() => {
                    // Trigger the ChatTC component to open by dispatching a custom event
                    window.dispatchEvent(new CustomEvent("openChatTC"));
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white transition-colors"
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
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
