import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  displayName: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
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
        } catch {}
        if (onlyGoogle && isBrandNew) {
          // Allow new Google signups only if the user explicitly agreed on the auth page.
          if (pendingAgreement) {
            try {
              await supabase.from("user_agreements").insert({
                user_id: u.id,
                agreed_privacy: true,
                agreed_terms: true,
                agreed_copyright: true,
                agreed_community_guidelines: true,
                signup_method: "google",
                agreed_at: pendingAgreement.at ?? new Date().toISOString(),
              });
            } catch {}
            try { localStorage.removeItem("cc_pending_agreement"); } catch {}
            setSession(session);
            setUser(u);
            setLoading(false);
            return;
          }
          // Block: this Google account has no prior CourseConnect registration.
          try {
            await supabase.functions.invoke("block-new-google-signup");
          } catch {
            // ignore — we still sign out below
          }
          await supabase.auth.signOut();
          toast.error("No account found", {
            description: "Please sign up with email and password first, then you can use Google to sign in.",
          });
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        // Email-signup case: session arrived after email verification; persist pending agreement.
        if (pendingAgreement && isBrandNew) {
          try {
            await supabase.from("user_agreements").insert({
              user_id: u.id,
              agreed_privacy: true,
              agreed_terms: true,
              agreed_copyright: true,
              agreed_community_guidelines: true,
              signup_method: pendingAgreement.method ?? "email",
              agreed_at: pendingAgreement.at ?? new Date().toISOString(),
            });
          } catch {}
          try { localStorage.removeItem("cc_pending_agreement"); } catch {}
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
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
    <AuthContext.Provider value={{ user, session, loading, displayName, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
