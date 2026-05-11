import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Video, Image, BookOpen, ChevronRight, Filter, GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

type BrowseStep = "university" | "department" | "level" | "materials";

interface University { id: string; name: string; short_name: string; }
interface Department { id: string; name: string; }
interface Level { id: string; name: string; sort_order: number; }
interface Material {
  id: string; title: string; description: string | null;
  type: string; file_url: string | null; downloads: number;
  course_id: string; created_at: string;
  courses?: { code: string; title: string; } | null;
}

const typeIcons: Record<string, typeof FileText> = {
  pdf: FileText, video: Video, image: Image, text: BookOpen,
};
const typeColors: Record<string, string> = {
  pdf: "bg-destructive/10 text-destructive",
  video: "bg-accent/10 text-accent-foreground",
  image: "bg-primary/10 text-primary",
  text: "bg-secondary text-secondary-foreground",
};

const ExplorePage = () => {
  const [step, setStep] = useState<BrowseStep>("university");
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    setLoading(true);
    const { data } = await supabase.from("universities").select("*").order("name");
    setUniversities((data as University[]) || []);
    setLoading(false);
  };

  const loadDepartments = async (uniId: string) => {
    setLoading(true);
    const { data } = await supabase.from("departments").select("*").eq("university_id", uniId).order("name");
    setDepartments((data as Department[]) || []);
    setLoading(false);
  };

  const loadLevels = async () => {
    setLoading(true);
    const { data } = await supabase.from("levels").select("*").order("sort_order");
    setLevels((data as Level[]) || []);
    setLoading(false);
  };

  const loadMaterials = async (deptId: string, levelId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("materials")
      .select("*, courses!inner(code, title)")
      .eq("status", "approved")
      .eq("courses.department_id", deptId)
      .eq("courses.level_id", levelId)
      .order("created_at", { ascending: false })
      .limit(60);
    setMaterials((data as Material[]) || []);
    setLoading(false);
  };

  const breadcrumbs = [
    { label: "Universities", step: "university" as BrowseStep },
    ...(selectedUni ? [{ label: selectedUni.short_name, step: "department" as BrowseStep }] : []),
    ...(selectedDept ? [{ label: selectedDept.name, step: "level" as BrowseStep }] : []),
    ...(selectedLevel ? [{ label: selectedLevel.name, step: "materials" as BrowseStep }] : []),
  ];

  const filtered = <T extends { name?: string; title?: string }>(items: T[]) =>
    items.filter((i) =>
      (i.name || i.title || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Explore Materials</h1>
          <p className="text-muted-foreground">
            Browse through universities, departments, levels and courses to find what you need.
          </p>
        </div>

        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-1 text-sm">
          {breadcrumbs.map((b, i) => (
            <div key={b.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <button
                onClick={() => {
                  setStep(b.step);
                  if (b.step === "university") { setSelectedUni(null); setSelectedDept(null); setSelectedLevel(null); }
                  if (b.step === "department") { setSelectedDept(null); setSelectedLevel(null); }
                  if (b.step === "level") { setSelectedLevel(null); }
                  setSearchQuery("");
                }}
                className="font-medium text-primary hover:underline"
              >
                {b.label}
              </button>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-8 flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                step === "university" ? "Search universities..." :
                step === "department" ? "Search departments..." :
                step === "level" ? "Search levels..." :
                "Search materials..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* University step */}
        {!loading && step === "university" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered(universities).map((uni) => (
              <button
                key={uni.id}
                onClick={() => { setSelectedUni(uni); setStep("department"); loadDepartments(uni.id); setSearchQuery(""); }}
                className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 text-left card-elevated"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    {uni.short_name.slice(0, 2)}
                  </div>
                  <div>
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors block">{uni.name}</span>
                    <span className="text-xs text-muted-foreground">{uni.short_name}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Department step */}
        {!loading && step === "department" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered(departments).map((dept) => (
              <button
                key={dept.id}
                onClick={() => { setSelectedDept(dept); setStep("level"); loadLevels(); setSearchQuery(""); }}
                className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 text-left card-elevated"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <BookOpen className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">{dept.name}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Level step */}
        {!loading && step === "level" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered(levels).map((level) => (
              <button
                key={level.id}
                onClick={() => {
                  setSelectedLevel(level);
                  setStep("materials");
                  if (selectedDept) loadMaterials(selectedDept.id, level.id);
                  setSearchQuery("");
                }}
                className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 text-left card-elevated"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                    <GraduationCap className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">{level.name}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Materials step */}
        {!loading && step === "materials" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {materials.length === 0 ? (
              <div className="py-20 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">No materials yet</h3>
                <p className="mb-4 text-muted-foreground">Be the first to upload materials for this course level!</p>
                <Button asChild><a href="/upload">Upload Materials</a></Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {materials.map((material) => {
                  const Icon = typeIcons[material.type] || FileText;
                  const colorClass = typeColors[material.type] || typeColors.text;
                  return (
                    <div key={material.id} className="rounded-xl border border-border bg-card p-5 card-elevated">
                      <div className="mb-3 flex items-start justify-between">
                        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {material.type.toUpperCase()}
                        </div>
                        <span className="text-xs text-muted-foreground">{material.downloads} downloads</span>
                      </div>
                      <h3 className="mb-1 font-display text-base font-semibold text-foreground">{material.title}</h3>
                      <p className="mb-3 text-sm text-muted-foreground">
                        {material.courses?.code} • {material.courses?.title}
                      </p>
                      {material.file_url && (
                        <Button size="sm" className="w-full" asChild>
                          <a href={material.file_url} target="_blank" rel="noopener noreferrer">View Material</a>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ExplorePage;
