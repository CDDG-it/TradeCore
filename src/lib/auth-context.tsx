"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { invalidateReads } from "@/lib/supabase/cache";
import { clearAllDrafts } from "@/lib/drafts";
import { getAvatarUrl } from "@/lib/supabase/storage";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  /**
   * A link the browser can load for the account's profile photo.
   *
   * The account stores a storage path, not a URL: the avatars bucket is
   * private, so the link has to be signed. It is signed once here rather than
   * in each place a photo appears, and re-signed whenever the account changes
   * or the photo is replaced.
   */
  avatarUrl: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  avatarUrl: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  /**
   * Who the cached reads belong to. The read cache in `supabase/cache` lives
   * for as long as the tab does, so if the account changes underneath it,
   * whatever it is holding belongs to the previous account and must go.
   * Signing out through the button reloads the page and clears it anyway, but
   * a session that expires, is revoked, or is swapped from another tab does
   * not, and that is the path where one trader's rows could be handed to the
   * next.
   */
  const ownerRef = useRef<string | null>(null);
  /**
   * Whether the user we are holding came from the Auth server rather than the
   * cookie. A cookie carries whatever profile data was current when it was
   * written, so it can be behind: change your name or your photo and the
   * cookie keeps the old one until it is next rewritten. Letting a cookie
   * overwrite a verified user is how a freshly uploaded avatar disappears
   * again a moment after it is set.
   */
  const verifiedRef = useRef(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const adopt = (next: User | null, authoritative: boolean) => {
      const nextId = next?.id ?? null;
      if (ownerRef.current !== null && ownerRef.current !== nextId) {
        invalidateReads();
        clearAllDrafts();
      }
      // Same account, and what we already have was verified: keep it. The
      // cookie's copy may be older, and downgrading loses profile changes.
      if (!authoritative && verifiedRef.current && ownerRef.current === nextId) {
        return;
      }
      verifiedRef.current = authoritative;
      ownerRef.current = nextId;
      setUser(next);
    };

    // Use getUser() for authoritative server-validated auth check,
    // then getSession() only to retrieve the access token for downstream use.
    Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]).then(([{ data: { user } }, { data: { session } }]) => {
      adopt(user, true);
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (event === "USER_UPDATED" && session) {
          // The profile just changed. Ask the server what it now says rather
          // than trusting the copy in the cookie, which is what we changed.
          supabase.auth
            .getUser()
            .then(({ data: { user } }) => adopt(user, true))
            .catch(() => adopt(session.user, false));
        } else {
          adopt(session?.user ?? null, false);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign the stored avatar whenever it changes. `updateUser` fires an auth
  // state change, so replacing the photo re-runs this on its own.
  const storedAvatar = (user?.user_metadata?.avatar_url as string | null | undefined) ?? null;
  useEffect(() => {
    if (!storedAvatar) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    getAvatarUrl(storedAvatar)
      .then((url) => {
        if (!cancelled) setAvatarUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [storedAvatar]);

  const signOut = async () => {
    const supabase = createClient();
    // Clear what is ours before the network call, so a failed sign-out still
    // leaves nothing behind on this machine.
    invalidateReads();
    clearAllDrafts();
    try {
      await supabase.auth.signOut();
    } finally {
      // A full load, not a router push: it is the only thing that empties the
      // in-memory caches every module is holding.
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, avatarUrl, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
