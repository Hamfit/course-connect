import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-image.jpg";

const fetchStats = async () => {
  const [unis, mats, users] = await Promise.all([
    supabase.from("universities").select("*", { count: "exact", head: true }),
    supabase.from("materials").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);
  return {
    universities: unis.count ?? 0,
    materials: mats.count ?? 0,
    students: users.count ?? 0,
  };
};

const formatCount = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K+`;
  return n.toString();
};

const HeroSection = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: stats } = useQuery({ queryKey: ["hero-stats"], queryFn: fetchStats });

  const items = [
    { value: stats ? stats.universities.toString() : "—", label: stats?.universities === 1 ? "University" : "Universities" },
    { value: stats ? formatCount(stats.materials) : "—", label: "Course Materials" },
    { value: stats ? formatCount(stats.students) : "—", label: "Students" },
  ];

  return (
    <section className="relative overflow-hidden hero-gradient">
      <div className="absolute inset-0 pattern-dots opacity-30" />

      <div className="container relative mx-auto px-4 py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground">
              <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
              Now live at UNILAG
            </div>

            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              Your Course Materials,{" "}
              <span className="text-gradient">All in One Place</span>
            </h1>

            <p className="mb-8 max-w-lg text-lg leading-relaxed text-primary-foreground/80">
              Built first for UNILAG students. Find verified notes, past questions and
              lecture materials organised by department, level and course — no more scrambling during exam period.
            </p>

            <form
              className="mb-8 flex max-w-md gap-2"
              onSubmit={(e) => { e.preventDefault(); navigate("/explore"); }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search departments, courses..."
                  className="h-12 bg-primary-foreground pl-10 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button type="submit" variant="hero" size="lg" className="h-12">
                Search
              </Button>
            </form>

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

            <div className="flex gap-8">
              {items.map((stat) => (
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