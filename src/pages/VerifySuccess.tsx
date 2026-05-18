import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const VerifySuccess = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-lg"
        >
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mb-3 font-display text-2xl font-bold text-foreground">
            Email Verified Successfully!
          </h1>
          <p className="mb-8 text-muted-foreground">
            Your email has been confirmed. You can now safely close this window and return to your original device, or continue to the app here.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full gap-2">
              <Link to="/explore">
                Go to Explore <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifySuccess;
