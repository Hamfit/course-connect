import { useState } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Video, Image, BookOpen, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const universities = [
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Obafemi Awolowo University (OAU)",
  "University of Nigeria, Nsukka (UNN)",
  "Ahmadu Bello University (ABU)",
  "University of Benin (UNIBEN)",
  "Federal University of Technology, Minna",
  "Covenant University",
  "Lagos State University (LASU)",
  "University of Ilorin (UNILORIN)",
];

const departments = [
  "Computer Science",
  "Electrical Engineering",
  "Medicine & Surgery",
  "Accounting",
  "Economics",
  "Law",
  "Mechanical Engineering",
  "Biochemistry",
  "Mass Communication",
  "Business Administration",
];

const sampleMaterials = [
  { title: "CSC 201 - Data Structures Notes", type: "pdf", university: "UNILAG", department: "Computer Science", course: "CSC 201", uploads: 45 },
  { title: "Introduction to Microeconomics Lecture", type: "video", university: "UI", department: "Economics", course: "ECO 101", uploads: 32 },
  { title: "Anatomy Diagrams Collection", type: "image", university: "UNN", department: "Medicine", course: "ANA 101", uploads: 67 },
  { title: "Principles of Accounting Summary", type: "pdf", university: "OAU", department: "Accounting", course: "ACC 101", uploads: 89 },
  { title: "Circuit Analysis Video Series", type: "video", university: "ABU", department: "Electrical Eng.", course: "EEE 201", uploads: 23 },
  { title: "Constitutional Law Case Studies", type: "pdf", university: "UNIBEN", department: "Law", course: "LAW 301", uploads: 56 },
];

const typeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  video: Video,
  image: Image,
  text: BookOpen,
};

const typeColors: Record<string, string> = {
  pdf: "bg-destructive/10 text-destructive",
  video: "bg-gold/10 text-gold",
  image: "bg-primary/10 text-primary",
  text: "bg-secondary text-secondary-foreground",
};

type BrowseStep = "university" | "department" | "materials";

const ExplorePage = () => {
  const [step, setStep] = useState<BrowseStep>("university");
  const [selectedUni, setSelectedUni] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUnis = universities.filter((u) =>
    u.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDepts = departments.filter((d) =>
    d.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredMaterials = sampleMaterials.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const breadcrumbs = [
    { label: "Universities", step: "university" as BrowseStep, active: true },
    ...(selectedUni ? [{ label: selectedUni.split("(")[0].trim(), step: "department" as BrowseStep, active: true }] : []),
    ...(selectedDept ? [{ label: selectedDept, step: "materials" as BrowseStep, active: true }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Explore Materials</h1>
          <p className="text-muted-foreground">
            Browse through universities, departments, and courses to find what you need.
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
                  if (b.step === "university") { setSelectedUni(""); setSelectedDept(""); }
                  if (b.step === "department") { setSelectedDept(""); }
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

        {/* University step */}
        {step === "university" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredUnis.map((uni) => (
              <button
                key={uni}
                onClick={() => {
                  setSelectedUni(uni);
                  setStep("department");
                  setSearchQuery("");
                }}
                className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 text-left card-elevated"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    {uni.match(/\(([^)]+)\)/)?.[1]?.slice(0, 2) || uni.slice(0, 2)}
                  </div>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {uni}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Department step */}
        {step === "department" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredDepts.map((dept) => (
              <button
                key={dept}
                onClick={() => {
                  setSelectedDept(dept);
                  setStep("materials");
                  setSearchQuery("");
                }}
                className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 text-left card-elevated"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <BookOpen className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {dept}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Materials step */}
        {step === "materials" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredMaterials.map((material) => {
              const Icon = typeIcons[material.type] || FileText;
              const colorClass = typeColors[material.type] || typeColors.text;
              return (
                <div
                  key={material.title}
                  className="rounded-xl border border-border bg-card p-5 card-elevated"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {material.type.toUpperCase()}
                    </div>
                    <span className="text-xs text-muted-foreground">{material.uploads} downloads</span>
                  </div>
                  <h3 className="mb-1 font-display text-base font-semibold text-foreground">
                    {material.title}
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {material.course} • {material.department}
                  </p>
                  <Button size="sm" className="w-full">
                    View Material
                  </Button>
                </div>
              );
            })}
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ExplorePage;
