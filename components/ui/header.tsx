"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Logo from "./logo";
import MobileMenu from "./mobile-menu";

export default function Header() {
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const resourcesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="z-30 mt-2 w-full md:mt-5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-gray-900/90 px-3 border border-gray-800">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-gray-300 hover:text-white">
              Home
            </Link>
            <Link href="/blog" className="text-sm text-gray-300 hover:text-white">
              Blog
            </Link>
            <Link href="/help" className="text-sm text-gray-300 hover:text-white">
              Help
            </Link>

            {/* Resources Dropdown */}
            <div className="relative" ref={resourcesRef}>
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                className="flex items-center gap-1 text-sm text-gray-300 hover:text-white"
              >
                More
                <svg className={`w-4 h-4 transition-transform ${resourcesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {resourcesOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 py-2">
                  <Link href="/about" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white" onClick={() => setResourcesOpen(false)}>
                    <div className="font-medium">About</div>
                    <div className="text-xs text-gray-500">Our mission and team</div>
                  </Link>
                  <Link href="/#address-lookup" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white" onClick={() => setResourcesOpen(false)}>
                    <div className="font-medium">Map</div>
                    <div className="text-xs text-gray-500">Census tract eligibility</div>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Join Beta CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/#beta-signup"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Join Beta
            </Link>
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
