import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const stats = [
  { value: "150+", label: "Universities" },
  { value: "10K+", label: "Course Materials" },
  { value: "50K+", label: "Students" },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden hero-gradient">
      {/* Overlay pattern */}
      <div className="absolute inset-0 pattern-dots opacity-30" />

      <div className="container relative mx-auto px-4 py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground">
              <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
              Trusted by students across Nigeria
            </div>

            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              Your Course Materials,{" "}
              <span className="text-gradient">All in One Place</span>
            </h1>

            <p className="mb-8 max-w-lg text-lg leading-relaxed text-primary-foreground/80">
              Access verified course materials from your university, department, and courses.
              No more scrambling during exam period — everything you need, structured and ready.
            </p>

            {/* Search bar */}
            <div className="mb-8 flex max-w-md gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search universities, courses..."
                  className="h-12 bg-primary-foreground pl-10 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Link to="/explore">
                <Button variant="hero" size="lg" className="h-12">
                  Search
                </Button>
              </Link>
            </div>

            {/* CTA buttons */}
            <div className="mb-10 flex flex-wrap gap-3">
              <Link to="/explore">
                <Button variant="hero" size="lg" className="gap-2">
                  Explore Materials <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/upload">
                <Button variant="hero-outline" size="lg">
                  Upload Materials
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-2xl font-bold text-gold">
                    {stat.value}
                  </div>
                  <div className="text-sm text-primary-foreground/60">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute -inset-4 rounded-2xl bg-gold/20 blur-2xl" />
              <img
                src={heroImage}
                alt="Nigerian university students studying together with laptops and books"
                className="relative rounded-2xl shadow-2xl"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
