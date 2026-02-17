"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "./logo";
import MobileMenu from "./mobile-menu";
import HeaderSearch from "./header-search";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon } from "lucide-react";

export default function Header() {
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };
  const router = useRouter();
  const [platformOpen, setPlatformOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const platformRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let subscription: { unsubscribe: () => void };
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    subscription = data.subscription;
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        platformRef.current &&
        !platformRef.current.contains(event.target as Node)
      ) {
        setPlatformOpen(false);
      }
      if (
        resourcesRef.current &&
        !resourcesRef.current.contains(event.target as Node)
      ) {
        setResourcesOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
          <nav className="hidden md:flex items-center gap-5">
            <Link href="/" className="text-sm text-gray-300 hover:text-white">
              Home
            </Link>
            <Link
              href="/features"
              className="text-sm text-gray-300 hover:text-white"
            >
              Features
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm text-gray-300 hover:text-white"
            >
              How It Works
            </Link>
            <Link
              href="/who-we-serve"
              className="text-sm text-gray-300 hover:text-white"
            >
              Who We Serve
            </Link>

            {/* Platform Dropdown */}
            <div className="relative" ref={platformRef}>
              <button
                onClick={() => setPlatformOpen(!platformOpen)}
                className="flex items-center gap-1 text-sm text-gray-300 hover:text-white"
              >
                Platform
                <svg
                  className={`w-4 h-4 transition-transform ${platformOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {platformOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 py-2">
                  <Link
                    href="/map"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={() => setPlatformOpen(false)}
                  >
                    <div className="font-medium">Map</div>
                    <div className="text-xs text-gray-500">
                      Census tract eligibility
                    </div>
                  </Link>
                  <Link
                    href="/deals"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={() => setPlatformOpen(false)}
                  >
                    <div className="font-medium">Marketplace</div>
                    <div className="text-xs text-gray-500">
                      Browse tax credit deals
                    </div>
                  </Link>
                  <Link
                    href="/closing-room"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={() => setPlatformOpen(false)}
                  >
                    <div className="font-medium">Closing Room</div>
                    <div className="text-xs text-gray-500">
                      Deal collaboration hub
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* More Dropdown */}
            <div className="relative" ref={resourcesRef}>
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                className="flex items-center gap-1 text-sm text-gray-300 hover:text-white"
              >
                More
                <svg
                  className={`w-4 h-4 transition-transform ${resourcesOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {resourcesOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 py-2">
                  <Link
                    href="/blog"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={() => setResourcesOpen(false)}
                  >
                    <div className="font-medium">Blog</div>
                    <div className="text-xs text-gray-500">
                      Industry insights
                    </div>
                  </Link>
                  <Link
                    href="/about"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={() => setResourcesOpen(false)}
                  >
                    <div className="font-medium">About</div>
                    <div className="text-xs text-gray-500">
                      Our mission and team
                    </div>
                  </Link>
                  <Link
                    href="/help"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={() => setResourcesOpen(false)}
                  >
                    <div className="font-medium">Help</div>
                    <div className="text-xs text-gray-500">
                      Support and documentation
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Search + Auth buttons */}
          <div className="flex items-center gap-3">
            <HeaderSearch />

            {/* Auth - Signed In */}
            {!loading && user && (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-300 hover:text-white"
                >
                  Dashboard
                </Link>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium hover:bg-indigo-500"
                  >
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 py-2">
                      <div className="px-4 py-2 border-b border-gray-800">
                        <div className="text-sm text-white truncate">
                          {user.email}
                        </div>
                      </div>
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <UserIcon className="w-4 h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Auth - Signed Out */}
            {!loading && !user && (
              <>
                <Link
                  href="/signin"
                  className="text-sm text-gray-300 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg"
                >
                  Register
                </Link>
              </>
            )}

            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
