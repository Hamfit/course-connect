import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UniRow {
  id: string;
  name: string;
  short_name: string;
  course_count: number;
}

const fetchUniversities = async (): Promise<UniRow[]> => {
  const { data } = await (supabase as any)
    .from("university_course_counts")
    .select("*")
    .order("name");
  return (data as UniRow[]) || [];
};

const PopularUniversities = () => {
  const { data: universities = [], isLoading } = useQuery({
    queryKey: ["universities-with-counts"],
    queryFn: fetchUniversities,
  });

  return (
    <section className="bg-secondary/50 py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">
              Available Universities
            </div>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Browse by University
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Launching with UNILAG. More universities coming soon.
            </p>
          </div>
          <Link to="/explore" className="hidden md:block">
            <Button variant="ghost" className="gap-2">
              Explore <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {universities.map((uni, i) => (
              <motion.div
                key={uni.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link to="/explore" className="block">
                  <div className="group rounded-xl border border-border bg-card p-5 card-elevated">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                      {uni.short_name.slice(0, 2)}
                    </div>
                    <h3 className="mb-1 font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {uni.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {uni.course_count} {uni.course_count === 1 ? "course" : "courses"} available
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link to="/explore">
            <Button variant="outline" className="gap-2">
              Explore Materials <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PopularUniversities;
