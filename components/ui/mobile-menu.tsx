"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function MobileMenu() {
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const mobileNav = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickHandler = ({ target }: { target: EventTarget | null }): void => {
      if (!mobileNav.current || !trigger.current) return;
      if (
        !mobileNavOpen ||
        mobileNav.current.contains(target as Node) ||
        trigger.current.contains(target as Node)
      )
        return;
      setMobileNavOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  useEffect(() => {
    const keyHandler = ({ key }: { key: string }): void => {
      if (!mobileNavOpen || key !== "Escape") return;
      setMobileNavOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  const closeMenu = () => setMobileNavOpen(false);

  return (
    <div className="md:hidden">
      <button
        ref={trigger}
        className={`hamburger ${mobileNavOpen && "active"}`}
        aria-controls="mobile-nav"
        aria-expanded={mobileNavOpen}
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
      >
        <span className="sr-only">Menu</span>
        <svg
          className="h-6 w-6 fill-current text-gray-300 transition duration-150 ease-in-out"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect y="4" width="24" height="2" rx="1" />
          <rect y="11" width="24" height="2" rx="1" />
          <rect y="18" width="24" height="2" rx="1" />
        </svg>
      </button>

      <nav
        id="mobile-nav"
        ref={mobileNav}
        className={`absolute left-0 top-full z-20 w-full overflow-hidden transition-all duration-300 ease-in-out ${
          mobileNavOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="rounded-2xl bg-gray-900/95 px-4 py-4 backdrop-blur-sm mt-2 mx-4 border border-gray-800 max-h-[70vh] overflow-y-auto">
          <Link href="/" className="block py-2 text-gray-300 hover:text-white font-medium" onClick={closeMenu}>
            Home
          </Link>
          <Link href="/blog" className="block py-2 text-gray-300 hover:text-white" onClick={closeMenu}>
            Blog
          </Link>
          <Link href="/help" className="block py-2 text-gray-300 hover:text-white" onClick={closeMenu}>
            Help
          </Link>
          <Link href="/about" className="block py-2 text-gray-300 hover:text-white" onClick={closeMenu}>
            About
          </Link>
          <Link href="/#address-lookup" className="block py-2 text-gray-300 hover:text-white" onClick={closeMenu}>
            Map Lookup
          </Link>

          {/* Join Beta CTA */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <Link
              href="/#beta-signup"
              className="block py-2 text-center text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium"
              onClick={closeMenu}
            >
              Join Beta
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
