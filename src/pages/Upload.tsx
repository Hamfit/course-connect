import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Video, Image, BookOpen, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";

interface University { id: string; name: string; short_name: string; }
interface Department { id: string; name: string; }
interface Level { id: string; name: string; sort_order: number; }
interface Course { id: string; title: string; code: string; semester: number; }

const UploadPage = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [materialType, setMaterialType] = useState<string>("pdf");
  const [file, setFile] = useState<File | null>(null);

  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [uniId, setUniId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [semester, setSemester] = useState<string>("");
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
        setProfile(data);
        if (data?.university_id) {
          setUniId(data.university_id);
        }
        setProfileLoading(false);
      });
    } else if (!authLoading) {
      setProfileLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    supabase.from("universities").select("*").order("name").then(({ data }) => setUniversities((data as University[]) || []));
  }, []);

  useEffect(() => {
    if (!uniId) return;
    setDeptId(""); setLevelId(""); setCourseId("");
    supabase.from("departments").select("*").eq("university_id", uniId).order("name").then(({ data }) => setDepartments((data as Department[]) || []));
  }, [uniId]);

  useEffect(() => {
    if (!deptId) return;
    setLevelId(""); setCourseId("");
    // Fetch only the levels that are valid for this department via the junction table
    supabase
      .from("department_levels")
      .select("level_id, levels(id, name, sort_order)")
      .eq("department_id", deptId)
      .order("levels(sort_order)")
      .then(({ data }) => {
        const lvls: Level[] = (data || [])
          .map((row: any) => row.levels)
          .filter(Boolean)
          .sort((a: Level, b: Level) => a.sort_order - b.sort_order);
        setLevels(lvls);
      });
  }, [deptId]);

  useEffect(() => {
    if (!deptId || !levelId || !semester) return;
    setCourseId("");
    supabase.from("courses").select("*").eq("department_id", deptId).eq("level_id", levelId).eq("semester", Number(semester)).order("code").then(({ data }) => setCourses((data as Course[]) || []));
  }, [deptId, levelId, semester]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUploading(true);

    try {
      let finalCourseId = courseId;

      // Create new course if needed
      if (courseId === "__new" && newCourseCode && newCourseTitle) {
        const { data: newCourse, error: courseErr } = await supabase
          .from("courses")
          .insert({ code: newCourseCode, title: newCourseTitle, department_id: deptId, level_id: levelId, semester: Number(semester) } as any)
          .select()
          .single();
        if (courseErr) throw courseErr;
        finalCourseId = (newCourse as any).id;
      }

      let fileUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("materials").upload(filePath, file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("materials").getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("materials").insert({
        title,
        description: description || null,
        type: materialType,
        file_url: fileUrl,
        course_id: finalCourseId,
        uploaded_by: user.id,
      } as any);

      if (error) throw error;

      setSubmitted(true);
      toast({ title: "Material Submitted!", description: "Your material has been submitted for review." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || profileLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isProfileComplete = profile?.university_id && profile?.department_id && profile?.level_id;

  if (!isProfileComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-20">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Update Your Profile</h2>
            <p className="mb-6 text-muted-foreground">
              You must complete your profile by selecting your university, department, and level before you can upload materials.
            </p>
            <Button asChild>
              <Link to="/profile">Go to Profile</Link>
            </Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-20">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Thank You!</h2>
            <p className="mb-6 text-muted-foreground">Your material has been submitted for review and will be available soon.</p>
            <Button onClick={() => { setSubmitted(false); setTitle(""); setDescription(""); setFile(null); }}>Upload Another</Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-foreground">Upload Materials</h1>
            <p className="text-muted-foreground">Share your course materials to help fellow students succeed. All uploads are reviewed before publishing.</p>
          </div>

          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-card p-6 sm:p-8">
            {/* University */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">University</label>
              <Select value={uniId} onValueChange={setUniId} required disabled={!isAdmin}>
                <SelectTrigger><SelectValue placeholder="Select your university" /></SelectTrigger>
                <SelectContent>
                  {universities.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} ({u.short_name})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            {uniId && (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Department</label>
                <Select value={deptId} onValueChange={setDeptId} required>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Level */}
            {deptId && (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Level</label>
                <Select value={levelId} onValueChange={setLevelId} required>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Semester */}
            {levelId && (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Semester</label>
                <Select value={semester} onValueChange={setSemester} required>
                  <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">First Semester</SelectItem>
                    <SelectItem value="2">Second Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Course */}
            {semester && (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Course</label>
                <Select value={courseId} onValueChange={setCourseId} required>
                  <SelectTrigger><SelectValue placeholder="Select or add course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} – {c.title}</SelectItem>)}
                    <SelectItem value="__new">+ Add new course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {courseId === "__new" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Course Code</label>
                  <Input placeholder="e.g. CSC 201" value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Course Title</label>
                  <Input placeholder="e.g. Data Structures" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} required />
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Material Title</label>
              <Input placeholder="e.g. Data Structures Complete Notes" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
              <Textarea placeholder="Brief description of the material..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            {/* Material type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Material Type</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { value: "pdf", label: "PDF", icon: FileText },
                  { value: "video", label: "Video", icon: Video },
                  { value: "image", label: "Image", icon: Image },
                  { value: "text", label: "Notes", icon: BookOpen },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors ${materialType === type.value ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary"}`}
                  >
                    <input type="radio" name="type" value={type.value} checked={materialType === type.value} onChange={() => setMaterialType(type.value)} className="sr-only" />
                    <type.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Upload File</label>
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.mp4,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 p-8 text-center transition-colors hover:border-primary/50"
              >
                {file ? (
                  <>
                    <FileText className="mb-3 h-8 w-8 text-primary" />
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="mb-1 text-sm font-medium text-foreground">Click to select your file</p>
                    <p className="text-xs text-muted-foreground">PDF, MP4, JPG, PNG up to 50MB</p>
                  </>
                )}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={uploading || !courseId || courseId === "" || (materialType !== "text" && !file)}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Submit Material"}
            </Button>
          </motion.form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UploadPage;
