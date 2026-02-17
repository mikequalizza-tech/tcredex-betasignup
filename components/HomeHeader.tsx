// components/HomeHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";

export default function HomeHeader() {
  return (
    <header className="w-full border-b border-indigo-400/20 bg-slate-950 text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/logo-tcredex-cropped.png"
            alt="tCredex"
            width={32}
            height={32}
            className="h-8 w-auto"
          />
          <span className="text-xl font-semibold text-indigo-300 hover:text-white transition">
            tCredex
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex space-x-6 text-sm font-medium text-indigo-100">
          <Link href="/" className="hover:text-white transition">
            Home
          </Link>
          <Link href="/how-it-works" className="hover:text-white transition">
            How It Works
          </Link>
          <Link href="/map" className="hover:text-white transition">
            Map
          </Link>
          <Link href="/deals" className="hover:text-white transition">
            Deals
          </Link>
          <Link href="/automatch" className="hover:text-white transition">
            AutoMatch
          </Link>
          <Link href="/who-we-serve" className="hover:text-white transition">
            Who We Serve
          </Link>
          <Link href="/about" className="hover:text-white transition">
            About
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="text-sm font-medium text-indigo-200 hover:text-white transition"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
