import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const universities = [
  { name: "University of Lagos", shortName: "UNILAG", courses: 320, color: "bg-primary" },
  { name: "University of Ibadan", shortName: "UI", courses: 280, color: "bg-gold" },
  { name: "Obafemi Awolowo University", shortName: "OAU", courses: 250, color: "bg-primary" },
  { name: "University of Nigeria", shortName: "UNN", courses: 300, color: "bg-gold" },
  { name: "Ahmadu Bello University", shortName: "ABU", courses: 270, color: "bg-primary" },
  { name: "University of Benin", shortName: "UNIBEN", courses: 220, color: "bg-gold" },
  { name: "Federal University of Technology, Minna", shortName: "FUTMinna", courses: 190, color: "bg-primary" },
  { name: "Covenant University", shortName: "CU", courses: 160, color: "bg-gold" },
];

const PopularUniversities = () => {
  return (
    <section className="bg-secondary/50 py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">
              Popular Universities
            </div>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Browse by University
            </h2>
          </div>
          <Link to="/explore" className="hidden md:block">
            <Button variant="ghost" className="gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {universities.map((uni, i) => (
            <motion.div
              key={uni.shortName}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link to="/explore" className="block">
                <div className="group rounded-xl border border-border bg-card p-5 card-elevated">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${uni.color} text-sm font-bold text-primary-foreground`}>
                    {uni.shortName.slice(0, 2)}
                  </div>
                  <h3 className="mb-1 font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {uni.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {uni.courses} courses available
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link to="/explore">
            <Button variant="outline" className="gap-2">
              View All Universities <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PopularUniversities;
