import { motion } from "framer-motion";
import { Upload, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl hero-gradient p-10 sm:p-16"
        >
          <div className="absolute inset-0 pattern-dots opacity-20" />

          <div className="relative mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-gold/20 p-3">
              <Upload className="h-6 w-6 text-gold" />
            </div>

            <h2 className="mb-4 text-3xl font-bold text-primary-foreground sm:text-4xl">
              Got Materials? Share With Fellow Students
            </h2>

            <p className="mb-8 text-lg text-primary-foreground/80">
              Help your coursemates succeed. Upload your notes, past questions,
              textbooks, and study guides. Together we rise.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/upload">
                <Button variant="hero" size="lg" className="gap-2">
                  <Upload className="h-4 w-4" /> Upload Materials
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="hero-outline" size="lg" className="gap-2">
                  Browse Materials <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
