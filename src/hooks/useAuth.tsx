import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { POSTGRES_UNIQUE_VIOLATION, supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  hasAgreements: boolean;
  refreshAgreements: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  displayName: null,
  avatarUrl: null,
  hasAgreements: true,
  refreshAgreements: async () => { },
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasAgreements, setHasAgreements] = useState<boolean>(true);
  const [checkingAgreements, setCheckingAgreements] = useState(true);
  const checkedUserIdRef = useRef<string | null>(null);

  const checkAgreements = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_agreements")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking user agreements:", error.message);
        setHasAgreements(true); // Fallback to avoid locking user out
      } else {
        setHasAgreements(!!data);
      }
    } catch (err) {
      console.error("Failed checking agreements:", err);
      setHasAgreements(true);
    }
  };

  const refreshAgreements = async () => {
    if (user) {
      await checkAgreements(user.id);
    }
  };

  // 1. Initialize auth session and listen to transitions synchronously
  useEffect(() => {
    let initialLoaded = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_OUT") {
        setHasAgreements(true);
      }

      if (initialLoaded) {
        setAuthLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      initialLoaded = true;
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Perform compliance verification asynchronously after state transitions
  useEffect(() => {
    if (!session) {
      setHasAgreements(true);
      setCheckingAgreements(false);
      checkedUserIdRef.current = null;
      return;
    }

    const currentUser = session.user;
    if (checkedUserIdRef.current === currentUser.id) {
      // Already checked agreements for this user, do not run check again
      return;
    }

    const runChecks = async () => {
      setCheckingAgreements(true);
      checkedUserIdRef.current = currentUser.id;

      const identities = (currentUser.identities ?? []) as Array<{ provider: string }>;
      const onlyGoogle = identities.length > 0 && identities.every((i) => i.provider === "google");
      const createdAt = currentUser.created_at ? new Date(currentUser.created_at).getTime() : 0;
      const isBrandNew = Date.now() - createdAt < 60_000;
      let pendingAgreement: { method?: string; at?: string } | null = null;
      try {
        const raw = localStorage.getItem("cc_pending_agreement");
        if (raw) pendingAgreement = JSON.parse(raw);
      } catch (e) {
        console.warn("Could not read local agreement state:", e);
      }

      if (onlyGoogle && isBrandNew) {
        if (pendingAgreement) {
          try {
            const { error } = await supabase.from("user_agreements").insert({
              user_id: currentUser.id,
              agreed_privacy: true,
              agreed_terms: true,
              agreed_copyright: true,
              agreed_community_guidelines: true,
              signup_method: "google",
              agreed_at: pendingAgreement.at ?? new Date().toISOString(),
            });
            if (error) {
              console.error("Failed to auto-insert Google agreements:", error.message);
              if (error.code === POSTGRES_UNIQUE_VIOLATION) {
                setHasAgreements(true);
              } else {
                setHasAgreements(false);
              }
            } else {
              setHasAgreements(true);
            }
          } catch (err) {
            console.error("Exception in auto-insert Google agreements:", err);
            setHasAgreements(false);
          }
          try {
            localStorage.removeItem("cc_pending_agreement");
          } catch (e) {
            console.warn("Failed to clear local agreement state:", e);
          }
        } else {
          setHasAgreements(false);
        }
      } else {
        await checkAgreements(currentUser.id);
        if (pendingAgreement) {
          // user already has agreements, just remove the pending agreement from local storage
          try {
            localStorage.removeItem("cc_pending_agreement");
          } catch (e) {
            console.warn("Failed to clear local agreement state:", e);
          }
        }
      }

      setCheckingAgreements(false);
    };

    runChecks();
  }, [session]);

  // 3. Load user display name and avatar, and subscribe to profile updates
  useEffect(() => {
    if (!user) { 
      setDisplayName(null); 
      setAvatarUrl(null); 
      return; 
    }
    
    const fetchProfile = () => {
      supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).single()
        .then(({ data }) => {
          setDisplayName(data?.display_name ?? user.user_metadata?.display_name ?? null);
          setAvatarUrl(data?.avatar_url ?? null);
        });
    };

    fetchProfile();

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setDisplayName(payload.new.display_name ?? null);
          setAvatarUrl(payload.new.avatar_url ?? null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const activeLoading = authLoading || (user ? checkingAgreements : false);

  return (
    <AuthContext.Provider value={{ user, session, loading: activeLoading, displayName, avatarUrl, hasAgreements, refreshAgreements, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
