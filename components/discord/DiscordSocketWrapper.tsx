"use client";

/**
 * Discord Socket Wrapper
 * Integrates DiscordSocketProvider with Supabase authentication
 * Provides real-time messaging capabilities to child components
 */

import { ReactNode } from "react";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { DiscordSocketProvider } from "@/lib/socket/DiscordSocketProvider";

interface DiscordSocketWrapperProps {
  children: ReactNode;
}

export function DiscordSocketWrapper({ children }: DiscordSocketWrapperProps) {
  const { userId, isAuthenticated, isLoading } = useCurrentUser();

  // Don't connect socket until auth is loaded and user is authenticated
  if (isLoading || !isAuthenticated || !userId) {
    return <>{children}</>;
  }

  return (
    <DiscordSocketProvider userId={userId} autoConnect={true}>
      {children}
    </DiscordSocketProvider>
  );
}
