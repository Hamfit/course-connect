import { useState, useEffect } from "react";
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
import { Loader2, Pencil, BookOpen, GraduationCap, Building2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  university_id: string | null;
  department_id: string | null;
  level_id: string | null;
  created_at: string;
}

interface University { id: string; name: string; short_name: string; }
interface Department { id: string; name: string; }
interface Level { id: string; name: string; }
interface MaterialSummary { id: string; title: string; type: string; created_at: string; }

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
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", uid)
      .single();

    if (data) {
      setProfile(data);
      setDisplayName(data.display_name);
      setUniversityId(data.university_id);
      setDepartmentId(data.department_id);
      setLevelId(data.level_id);

      // Resolve names
      if (data.university_id) {
        const { data: uni } = await supabase.from("universities").select("name").eq("id", data.university_id).single();
        setUniName(uni?.name ?? null);
      }
      if (data.department_id) {
        const { data: dept } = await supabase.from("departments").select("name").eq("id", data.department_id).single();
        setDeptName(dept?.name ?? null);
      }
      if (data.level_id) {
        const { data: lvl } = await supabase.from("levels").select("name").eq("id", data.level_id).single();
        setLevelName(lvl?.name ?? null);
      }
    }

    // Load public materials
    const { data: mats } = await supabase
      .from("materials")
      .select("id, title, type, created_at")
      .eq("uploaded_by", uid)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(10);
    setMaterials(mats || []);

    setLoading(false);
  };

  const startEditing = async () => {
    setEditing(true);
    const [{ data: unis }, { data: lvls }] = await Promise.all([
      supabase.from("universities").select("*").order("name"),
      supabase.from("levels").select("*").order("sort_order"),
    ]);
    setUniversities(unis || []);
    setLevels(lvls || []);
    if (universityId) {
      const { data: depts } = await supabase.from("departments").select("*").eq("university_id", universityId).order("name");
      setDepartments(depts || []);
    }
  };

  const onUniversityChange = async (val: string) => {
    setUniversityId(val);
    setDepartmentId(null);
    const { data } = await supabase.from("departments").select("*").eq("university_id", val).order("name");
    setDepartments(data || []);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        university_id: universityId,
        department_id: departmentId,
        level_id: levelId,
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
            <Avatar className="h-20 w-20 text-2xl">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </div>
                  <div>
                    <Label>University</Label>
                    <Select value={universityId || ""} onValueChange={onUniversityChange}>
                      <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
                      <SelectContent>
                        {universities.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Select value={departmentId || ""} onValueChange={(v) => setDepartmentId(v)} disabled={!universityId}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <div className="flex gap-2 pt-2">
                    <Button onClick={saveProfile} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
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
                  <li key={m.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-foreground">{m.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.type.toUpperCase()} • {new Date(m.created_at).toLocaleDateString()}
                      </p>
                    </div>
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
