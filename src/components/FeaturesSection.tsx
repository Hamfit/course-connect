import { motion } from "framer-motion";
import { GraduationCap, Upload, Search, Shield, BookOpen, Users } from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "University Specific",
    description: "Materials organized by your exact university, department, and course. No mix-ups.",
  },
  {
    icon: Upload,
    title: "Student Uploads",
    description: "Upload and share verified course materials — PDFs, videos, images, and notes.",
  },
  {
    icon: Search,
    title: "Easy Discovery",
    description: "Find exactly what you need with powerful search across all courses and materials.",
  },
  {
    icon: Shield,
    title: "Verified Content",
    description: "Community-verified materials so you study with trusted, accurate resources.",
  },
  {
    icon: BookOpen,
    title: "Structured Library",
    description: "Well-organized material library for each course — no more scattered WhatsApp files.",
  },
  {
    icon: Users,
    title: "Peer Community",
    description: "Connect with fellow students, share knowledge, and excel together.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">
            Why Course Connect
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Everything You Need to Ace Your Exams
          </h2>
          <p className="text-lg text-muted-foreground">
            Built by students, for students. We understand the struggle of finding materials during exam period.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group rounded-xl border border-border bg-card p-6 card-elevated"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
