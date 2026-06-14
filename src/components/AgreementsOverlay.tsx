import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { POSTGRES_UNIQUE_VIOLATION, supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import logo from "@/assets/logo.ico";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const AgreementsOverlay = () => {
  const { user, hasAgreements, refreshAgreements, signOut } = useAuth();
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedCopyright, setAgreedCopyright] = useState(false);
  const [agreedCommunity, setAgreedCommunity] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Exempt legal pages so blocked users can read them
  const isLegalPage = ["/privacy", "/terms", "/community-guidelines", "/copyright"].includes(
    window.location.pathname
  );

  if (!user || hasAgreements || isLegalPage) {
    return null;
  }

  const handleAccept = async () => {
    if (!agreedTerms || !agreedPrivacy || !agreedCopyright || !agreedCommunity) {
      toast.error("All agreements are required", {
        description: "Please check all boxes to proceed.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("user_agreements").insert({
        user_id: user.id,
        agreed_privacy: true,
        agreed_terms: true,
        agreed_copyright: true,
        agreed_community_guidelines: true,
        signup_method: "google",
        agreed_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === POSTGRES_UNIQUE_VIOLATION) {
          toast.success("Agreements accepted successfully!");
          await refreshAgreements();
        } else {
          toast.error("Failed to save agreements", {
            description: error.message,
          });
        }
      } else {
        toast.success("Agreements accepted successfully!");
        await refreshAgreements();
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred", {
        description: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3 justify-center">
          <img src={logo} alt="CourseConnect Logo" className="h-10 w-10" />
          <span className="font-display text-2xl font-bold text-foreground">
            Course<span className="text-gold">Connect</span>
          </span>
        </div>

        <h2 className="mb-2 text-center font-display text-xl font-bold text-foreground">
          Review & Accept Agreements
        </h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Welcome to CourseConnect! Before accessing your academic materials, please review and accept our platform agreements.
        </p>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
            <Checkbox
              id="overlay-terms"
              checked={agreedTerms}
              onCheckedChange={(checked) => setAgreedTerms(checked === true)}
              className="mt-0.5"
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="overlay-terms" className="text-sm font-medium leading-none text-foreground cursor-pointer">
                Terms of Service
              </label>
              <p className="text-xs text-muted-foreground">
                Understand user duties, restrictions and platform governance.{" "}
                <Link to="/terms" target="_blank" className="text-primary hover:underline font-medium">
                  Read terms
                </Link>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
            <Checkbox
              id="overlay-privacy"
              checked={agreedPrivacy}
              onCheckedChange={(checked) => setAgreedPrivacy(checked === true)}
              className="mt-0.5"
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="overlay-privacy" className="text-sm font-medium leading-none text-foreground cursor-pointer">
                Privacy Policy
              </label>
              <p className="text-xs text-muted-foreground">
                Learn how we securely collect, use, and process your data.{" "}
                <Link to="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                  Read privacy
                </Link>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
            <Checkbox
              id="overlay-copyright"
              checked={agreedCopyright}
              onCheckedChange={(checked) => setAgreedCopyright(checked === true)}
              className="mt-0.5"
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="overlay-copyright" className="text-sm font-medium leading-none text-foreground cursor-pointer">
                Copyright Policy
              </label>
              <p className="text-xs text-muted-foreground">
                Verify guidelines regarding academic materials ownership.{" "}
                <Link to="/copyright" target="_blank" className="text-primary hover:underline font-medium">
                  Read copyright
                </Link>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
            <Checkbox
              id="overlay-community"
              checked={agreedCommunity}
              onCheckedChange={(checked) => setAgreedCommunity(checked === true)}
              className="mt-0.5"
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="overlay-community" className="text-sm font-medium leading-none text-foreground cursor-pointer">
                Community Guidelines
              </label>
              <p className="text-xs text-muted-foreground">
                Review expectations for healthy academic collaboration.{" "}
                <Link to="/community-guidelines" target="_blank" className="text-primary hover:underline font-medium">
                  Read guidelines
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={signOut}
            className="w-full sm:w-auto"
            disabled={submitting}
          >
            Sign Out
          </Button>
          <Button
            onClick={handleAccept}
            className="w-full sm:w-auto gap-2"
            disabled={submitting || !agreedTerms || !agreedPrivacy || !agreedCopyright || !agreedCommunity}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Accept & Continue
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AgreementsOverlay;
