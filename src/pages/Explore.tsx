import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Video, Image, BookOpen, ChevronRight, Filter, GraduationCap, CalendarDays, Loader2, Download, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

type BrowseStep = "university" | "department" | "level" | "semester" | "materials";

interface University { id: string; name: string; short_name: string; }
interface Department { id: string; name: string; }
interface Level { id: string; name: string; sort_order: number; }
interface Material {
  id: string; title: string; description: string | null;
  type: string; file_url: string | null; downloads: number;
  course_id: string; created_at: string;
  courses?: { code: string; title: string; semester: number; } | null;
}

const SEMESTERS = [
  { value: 1, label: "First Semester" },
  { value: 2, label: "Second Semester" },
];

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
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "title">("recent");
  const [viewing, setViewing] = useState<Material | null>(null);

  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const visibleMaterials = useMemo(() => {
    let list = materials.filter((m) =>
      (m.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.courses?.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.courses?.title || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (typeFilter !== "all") list = list.filter((m) => m.type === typeFilter);
    if (sortBy === "recent") list = [...list].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sortBy === "popular") list = [...list].sort((a, b) => b.downloads - a.downloads);
    if (sortBy === "title") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [materials, searchQuery, typeFilter, sortBy]);

  const activeFilterCount = (typeFilter !== "all" ? 1 : 0) + (sortBy !== "recent" ? 1 : 0);

  const handleDownload = async (material: Material) => {
    if (!material.file_url) return;
    try {
      const res = await fetch(material.file_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = material.file_url.split(".").pop()?.split("?")[0] || material.type;
      a.download = `${material.title}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(material.file_url, "_blank");
    }
    // Increment downloads counter (best-effort, fire-and-forget).
    try {
      await supabase.rpc("increment_material_downloads", { _id: material.id });
      setMaterials((prev) => prev.map((m) => m.id === material.id ? { ...m, downloads: m.downloads + 1 } : m));
    } catch {
      /* noop */
    }
  };

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

  const loadLevels = async (deptId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("department_levels")
      .select("level_id, levels(id, name, sort_order)")
      .eq("department_id", deptId);
    const lvls: Level[] = (data || [])
      .map((row: any) => row.levels)
      .filter(Boolean)
      .sort((a: Level, b: Level) => a.sort_order - b.sort_order);
    setLevels(lvls);
    setLoading(false);
  };

  const loadMaterials = async (deptId: string, levelId: string, semester: number) => {
    setLoading(true);
    const { data } = await supabase
      .from("materials")
      .select("*, courses!inner(code, title, semester)")
      .eq("status", "approved")
      .eq("courses.department_id", deptId)
      .eq("courses.level_id", levelId)
      .eq("courses.semester", semester)
      .order("created_at", { ascending: false })
      .limit(60);
    setMaterials((data as Material[]) || []);
    setLoading(false);
  };

  const breadcrumbs = [
    { label: "Universities", step: "university" as BrowseStep },
    ...(selectedUni ? [{ label: selectedUni.short_name, step: "department" as BrowseStep }] : []),
    ...(selectedDept ? [{ label: selectedDept.name, step: "level" as BrowseStep }] : []),
    ...(selectedLevel ? [{ label: selectedLevel.name, step: "semester" as BrowseStep }] : []),
    ...(selectedSemester ? [{ label: SEMESTERS.find((s) => s.value === selectedSemester)!.label, step: "materials" as BrowseStep }] : []),
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
        <div className="mb-6 flex flex-wrap items-center gap-y-1 gap-x-1 text-sm">
          {breadcrumbs.map((b, i) => (
            <div key={b.label} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
              <button
                onClick={() => {
                  setStep(b.step);
                if (b.step === "university") { setSelectedUni(null); setSelectedDept(null); setSelectedLevel(null); setSelectedSemester(null); }
                if (b.step === "department") { setSelectedDept(null); setSelectedLevel(null); setSelectedSemester(null); }
                if (b.step === "level") { setSelectedLevel(null); setSelectedSemester(null); }
                if (b.step === "semester") { setSelectedSemester(null); }
                  setSearchQuery("");
                }}
                className="font-medium text-primary hover:underline truncate max-w-[12rem]"
              >
                {b.label}
              </button>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-8 flex gap-3">
          <div className="relative flex-1 sm:max-w-md min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                step === "university" ? "Search universities..." :
                step === "department" ? "Search departments..." :
                step === "level" ? "Search levels..." :
                step === "semester" ? "Search semesters..." :
                "Search materials..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 relative">
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && step === "materials" && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              {step === "materials" ? (
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block text-xs font-medium uppercase text-muted-foreground">Type</Label>
                    <div className="flex flex-wrap gap-2">
                      {["all", "pdf", "video", "image", "text"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTypeFilter(t)}
                          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary"}`}
                        >
                          {t === "all" ? "All" : t.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs font-medium uppercase text-muted-foreground">Sort by</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { v: "recent", l: "Most recent" },
                        { v: "popular", l: "Most downloaded" },
                        { v: "title", l: "Title (A–Z)" },
                      ].map((o) => (
                        <button
                          key={o.v}
                          onClick={() => setSortBy(o.v as typeof sortBy)}
                          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${sortBy === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary"}`}
                        >
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => { setTypeFilter("all"); setSortBy("recent"); }}>
                      <X className="mr-2 h-3 w-3" /> Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Filters become available when browsing materials.</p>
              )}
            </PopoverContent>
          </Popover>
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
                onClick={() => { setSelectedDept(dept); setStep("level"); loadLevels(dept.id); setSearchQuery(""); }}
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
                  setStep("semester");
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

        {/* Semester step */}
        {!loading && step === "semester" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3 sm:grid-cols-2">
            {SEMESTERS.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase())).map((sem) => (
              <button
                key={sem.value}
                onClick={() => {
                  setSelectedSemester(sem.value);
                  setStep("materials");
                  if (selectedDept && selectedLevel) loadMaterials(selectedDept.id, selectedLevel.id, sem.value);
                  setSearchQuery("");
                }}
                className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 text-left card-elevated"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">{sem.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Materials step */}
        {!loading && step === "materials" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {visibleMaterials.length === 0 ? (
              <div className="py-20 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">{materials.length === 0 ? "No materials yet" : "No matches"}</h3>
                <p className="mb-4 text-muted-foreground">{materials.length === 0 ? "Be the first to upload materials for this course level!" : "Try adjusting your search or filters."}</p>
                <Button asChild><a href="/upload">Upload Materials</a></Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleMaterials.map((material) => {
                  const Icon = typeIcons[material.type] || FileText;
                  const colorClass = typeColors[material.type] || typeColors.text;
                  return (
                    <div key={material.id} className="flex flex-col rounded-xl border border-border bg-card p-5 card-elevated min-w-0">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {material.type.toUpperCase()}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{material.downloads} downloads</span>
                      </div>
                      <h3 className="mb-1 font-display text-base font-semibold text-foreground break-words">{material.title}</h3>
                      <p className="mb-3 text-sm text-muted-foreground break-words flex-1">
                        {material.courses?.code} • {material.courses?.title}
                      </p>
                      {material.file_url && (
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 gap-1.5" onClick={() => setViewing(material)}>
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => handleDownload(material)}>
                            <Download className="h-3.5 w-3.5" /> Download
                          </Button>
                        </div>
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

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-4xl p-0 sm:p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <DialogTitle className="pr-8 text-base sm:text-lg break-words">{viewing?.title}</DialogTitle>
            {viewing?.courses && (
              <p className="text-xs text-muted-foreground">{viewing.courses.code} • {viewing.courses.title}</p>
            )}
          </DialogHeader>
          <div className="bg-muted/30 max-h-[70vh] overflow-auto">
            {viewing?.file_url && viewing.type === "pdf" && (
              <iframe src={viewing.file_url} className="h-[70vh] w-full" title={viewing.title} />
            )}
            {viewing?.file_url && viewing.type === "image" && (
              <img src={viewing.file_url} alt={viewing.title} className="mx-auto max-h-[70vh] w-auto" />
            )}
            {viewing?.file_url && viewing.type === "video" && (
              <video src={viewing.file_url} controls className="mx-auto max-h-[70vh] w-full bg-black" />
            )}
            {viewing?.type === "text" && (
              <div className="p-4 sm:p-6 whitespace-pre-wrap text-sm text-foreground">
                {viewing.description || "No content available."}
              </div>
            )}
            {!viewing?.file_url && viewing?.type !== "text" && (
              <div className="p-8 text-center text-sm text-muted-foreground">No file attached.</div>
            )}
          </div>
          {viewing?.file_url && (
            <div className="flex justify-end gap-2 border-t border-border bg-background px-4 py-3 sm:px-6">
              <Button variant="outline" size="sm" asChild>
                <a href={viewing.file_url} target="_blank" rel="noopener noreferrer">Open in new tab</a>
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => viewing && handleDownload(viewing)}>
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExplorePage;
