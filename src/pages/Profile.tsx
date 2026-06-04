import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Pencil, BookOpen, GraduationCap, Building2, FileText, Camera, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  university_id: string | null;
  department_id: string | null;
  level_id: string | null;
  identification_url: string | null;
  created_at: string;
}

interface University { id: string; name: string; short_name: string; }
interface Department { id: string; name: string; }
interface Level { id: string; name: string; }
interface MaterialSummary { id: string; title: string; type: string; created_at: string; status: string; rejection_reason: string | null; }

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = userId || user?.id;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [idFile, setIdFile] = useState<File | null>(null);
  const [uploadingId, setUploadingId] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [levelId, setLevelId] = useState<string | null>(null);

  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);

  // Lookup names
  const [uniName, setUniName] = useState<string | null>(null);
  const [deptName, setDeptName] = useState<string | null>(null);
  const [levelName, setLevelName] = useState<string | null>(null);

  useEffect(() => {
    if (targetUserId) loadProfile(targetUserId);
  }, [targetUserId]);

  const loadProfile = async (uid: string) => {
    setLoading(true);
    const isOwn = user?.id === uid;
    let matsQuery: any = supabase
      .from("materials")
      .select("id, title, type, created_at, status, rejection_reason")
      .eq("uploaded_by", uid)
      .order("created_at", { ascending: false })
      .limit(20);
    if (!isOwn) matsQuery = matsQuery.eq("status", "approved");

    const [{ data }, { data: mats }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
      matsQuery,
    ]);

    if (data) {
      setProfile(data);
      setDisplayName(data.display_name);
      setUniversityId(data.university_id);
      setDepartmentId(data.department_id);
      setLevelId(data.level_id);

      // Resolve names in parallel
      const [uniRes, deptRes, lvlRes] = await Promise.all([
        data.university_id
          ? supabase.from("universities").select("name").eq("id", data.university_id).maybeSingle()
          : Promise.resolve({ data: null }),
        data.department_id
          ? supabase.from("departments").select("name").eq("id", data.department_id).maybeSingle()
          : Promise.resolve({ data: null }),
        data.level_id
          ? supabase.from("levels").select("name").eq("id", data.level_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setUniName((uniRes.data as any)?.name ?? null);
      setDeptName((deptRes.data as any)?.name ?? null);
      setLevelName((lvlRes.data as any)?.name ?? null);
    }

    setMaterials((mats as MaterialSummary[]) || []);
    setLoading(false);
  };

  /** Fetch levels filtered by department via the junction table */
  const fetchLevelsForDept = async (deptId: string) => {
    const { data } = await supabase
      .from("department_levels")
      .select("level_id, levels(id, name, sort_order)")
      .eq("department_id", deptId);
    const lvls: Level[] = (data || [])
      .map((row: any) => row.levels)
      .filter(Boolean)
      .sort((a: Level, b: Level) => (a as any).sort_order - (b as any).sort_order);
    setLevels(lvls);
  };

  const startEditing = async () => {
    setEditing(true);
    const { data: unis } = await supabase.from("universities").select("*").order("name");
    setUniversities(unis || []);
    if (universityId) {
      const { data: depts } = await supabase.from("departments").select("*").eq("university_id", universityId).order("name");
      setDepartments(depts || []);
    }
    // Load levels for the already-selected department (if any)
    if (departmentId) {
      await fetchLevelsForDept(departmentId);
    }
  };

  const onUniversityChange = async (val: string) => {
    setUniversityId(val);
    setDepartmentId(null);
    setLevelId(null);
    setLevels([]);
    const { data } = await supabase.from("departments").select("*").eq("university_id", val).order("name");
    setDepartments(data || []);
  };

  const onDepartmentChange = async (val: string) => {
    setDepartmentId(val);
    setLevelId(null);
    await fetchLevelsForDept(val);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Avatar must be under 2MB.", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
    toast({ title: "Avatar updated!" });
    loadProfile(user.id);
    setUploadingAvatar(false);
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    
    if (!profile.identification_url && !idFile) {
      toast({ title: "Identification Required", description: "Please upload your School ID or Admission Letter to update your profile.", variant: "destructive" });
      return;
    }

    setSaving(true);
    let identificationUrl = profile.identification_url;

    if (idFile) {
      setUploadingId(true);
      const ext = idFile.name.split(".").pop();
      const path = `${user.id}/id_document_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("identifications")
        .upload(path, idFile);

      setUploadingId(false);

      if (uploadError) {
        toast({ title: "Upload failed", description: "Failed to upload identification document.", variant: "destructive" });
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("identifications").getPublicUrl(path);
      identificationUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        university_id: universityId,
        department_id: departmentId,
        level_id: levelId,
        identification_url: identificationUrl,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
      setEditing(false);
      loadProfile(user.id);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-foreground">Profile not found</h2>
          <p className="mt-2 text-muted-foreground">This user doesn't exist or has no profile.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center gap-4 pt-8 pb-6 sm:flex-row sm:items-start sm:gap-6">
            <div className="relative group">
              <Avatar className="h-20 w-20 text-2xl">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <Camera className="h-5 w-5 text-white" />
                    )}
                  </button>
                </>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </div>
                  <div>
                    <Label>University</Label>
                    <Select value={universityId || ""} onValueChange={onUniversityChange} disabled={!!profile.university_id}>
                      <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
                      <SelectContent>
                        {universities.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!!profile.university_id && <p className="text-xs text-muted-foreground mt-1">University cannot be changed once set.</p>}
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Select value={departmentId || ""} onValueChange={onDepartmentChange} disabled={!universityId || !!profile.department_id}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!!profile.department_id && <p className="text-xs text-muted-foreground mt-1">Department cannot be changed once set.</p>}
                  </div>
                  <div>
                    <Label>Level</Label>
                    <Select value={levelId || ""} onValueChange={(v) => setLevelId(v)}>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        {levels.map((l) => (
                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Means of Identification (School ID / Admission Letter)</Label>
                    {!profile.identification_url ? (
                      <div className="mt-1">
                        <Input type="file" accept="image/*,.pdf" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
                        <p className="mt-1 text-xs text-muted-foreground">Required to update your profile.</p>
                      </div>
                    ) : (
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary" /> Document uploaded
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={saveProfile} disabled={saving || uploadingId}>
                      {(saving || uploadingId) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-foreground">{profile.display_name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {uniName && (
                      <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{uniName}</span>
                    )}
                    {deptName && (
                      <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{deptName}</span>
                    )}
                    {levelName && (
                      <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" />{levelName}</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                  {isOwnProfile && (
                    <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={startEditing}>
                      <Pencil className="h-3.5 w-3.5" /> Edit Profile
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Materials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" /> Uploaded Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            {materials.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isOwnProfile ? "You haven't uploaded any materials yet." : "No public materials from this user."}
              </p>
            ) : (
              <ul className="space-y-3">
                {materials.map((m) => (
                  <li key={m.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground break-words">{m.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.type.toUpperCase()} • {new Date(m.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {isOwnProfile && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            m.status === "approved"
                              ? "bg-primary/10 text-primary"
                              : m.status === "rejected"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {m.status}
                        </span>
                      )}
                    </div>
                    {isOwnProfile && m.status === "rejected" && m.rejection_reason && (
                      <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-foreground">
                        <span className="font-semibold text-destructive">Admin feedback:</span> {m.rejection_reason}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
