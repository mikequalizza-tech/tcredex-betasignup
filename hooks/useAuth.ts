import { useEffect, useState } from "react";

// Replace this endpoint with your actual session check endpoint.
const SESSION_API = "/api/auth/session";

export function useAuth() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch(SESSION_API, { credentials: "include" });
        if (!ignore && res.ok) {
          setUser(await res.json());
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchUser();
    return () => {
      ignore = true;
    };
  }, []);

  return { user, isAuthenticated: !!user, loading };
}
