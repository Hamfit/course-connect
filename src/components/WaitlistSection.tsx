import { motion } from "framer-motion";
import { Bell, School, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOOGLE_FORM_URL = "#"; // TODO: Replace with your actual Google Form URL

const WaitlistSection = () => {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />

      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl"
        >
          {/* Card wrapper */}
          <div className="relative rounded-2xl border border-border bg-card p-8 sm:p-12 card-elevated overflow-hidden">
            {/* Decorative gradient blur */}
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gold/15 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative text-center">
              {/* Icon badge */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-6 inline-flex items-center justify-center rounded-full bg-gold/15 p-4"
              >
                <Bell className="h-7 w-7 text-gold" />
              </motion.div>

              {/* Badge */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Expanding to more schools soon
              </div>

              <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
                Can't Find Your School or Department?
              </h2>

              <p className="mx-auto mb-8 max-w-lg text-base leading-relaxed text-muted-foreground">
                We're rolling out to more universities across Nigeria. Join the
                waitlist and we'll notify you as soon as your school and
                department are added to Course Connect.
              </p>

              {/* Feature chips */}
              <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
                {[
                  { icon: School, label: "Request your university" },
                  { icon: Bell, label: "Get notified on launch" },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm text-foreground"
                  >
                    <chip.icon className="h-4 w-4 text-gold" />
                    {chip.label}
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <a
                href={GOOGLE_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                id="waitlist-cta"
              >
                <Button
                  size="lg"
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                >
                  Join the Waitlist
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>

              <p className="mt-4 text-xs text-muted-foreground/70">
                Takes less than a minute · No spam, we promise
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WaitlistSection;
