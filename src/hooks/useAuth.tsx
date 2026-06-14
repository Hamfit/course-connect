import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { POSTGRES_UNIQUE_VIOLATION, supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string | null;
  hasAgreements: boolean;
  refreshAgreements: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  displayName: null,
  hasAgreements: true,
  refreshAgreements: async () => { },
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [hasAgreements, setHasAgreements] = useState<boolean>(true);

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

  useEffect(() => {
    let initialLoaded = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const u = session.user;
        const identities = (u.identities ?? []) as Array<{ provider: string }>;
        const onlyGoogle = identities.length > 0 && identities.every((i) => i.provider === "google");
        const createdAt = u.created_at ? new Date(u.created_at).getTime() : 0;
        const isBrandNew = Date.now() - createdAt < 60_000;
        let pendingAgreement: { method?: string; at?: string } | null = null;
        try {
          const raw = localStorage.getItem("cc_pending_agreement");
          if (raw) pendingAgreement = JSON.parse(raw);
        } catch (e) {
          console.warn("Could not read local agreement state:", e);
        }

        if (onlyGoogle && isBrandNew) {
          // Allow new Google signups only if the user explicitly agreed on the auth page.
          if (pendingAgreement) {
            try {
              const { error } = await supabase.from("user_agreements").insert({
                user_id: u.id,
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
          await checkAgreements(u.id);
        }
      } else if (event === "SIGNED_OUT") {
        setHasAgreements(true);
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (initialLoaded) {
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkAgreements(session.user.id);
      }
      initialLoaded = true;
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setDisplayName(null); return; }
    supabase.from("profiles").select("display_name").eq("user_id", user.id).single()
      .then(({ data }) => {
        setDisplayName(data?.display_name ?? user.user_metadata?.display_name ?? null);
      });
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, displayName, hasAgreements, refreshAgreements, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
