import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield, CheckCircle, XCircle, FileText, Video, Image, BookOpen,
  Loader2, ExternalLink, Clock, FileCheck, FileX, Files, Users, LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { RotateCcw } from "lucide-react";

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  file_url: string | null;
  created_at: string;
  uploaded_by: string;
  rejection_reason: string | null;
  courses: { code: string; title: string } | null;
  profiles: { display_name: string } | null;
}

const typeIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  video: Video,
  image: Image,
  text: BookOpen,
};

type Section = "overview" | "pending" | "approved" | "rejected" | "verify_profiles";

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  university_id: string | null;
  department_id: string | null;
  level_id: string | null;
  identification_url: string | null;
  created_at: string;
  verification_status: string;
  verification_rejection_reason: string | null;
  universities: { name: string; short_name: string } | null;
  departments: { name: string } | null;
  levels: { name: string } | null;
}

const AdminPage = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [section, setSection] = useState<Section>("overview");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // User verification states
  const [userSubTab, setUserSubTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [profileRejectTarget, setProfileRejectTarget] = useState<{ id: string; display_name: string } | null>(null);
  const [profileRejectReason, setProfileRejectReason] = useState("");

  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0, users: 0, pendingUsers: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string; mode: "reject" | "revoke" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!authLoading && user) fetchStats();
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && user && section !== "overview" && section !== "verify_profiles") {
      fetchMaterials(section as any);
    }
  }, [user, authLoading, section]);

  const fetchStats = async () => {
    setLoadingStats(true);
    const { data, error } = await supabase.rpc("get_admin_stats");
    if (error) {
      toast({ title: "Error fetching stats", description: error.message, variant: "destructive" });
    } else if (data) {
      const statsData = data as any;
      setStats({
        pending: statsData.pending || 0,
        approved: statsData.approved || 0,
        rejected: statsData.rejected || 0,
        total: statsData.total || 0,
        users: statsData.users || 0,
        pendingUsers: statsData.pendingUsers || 0,
      });
    }
    setLoadingStats(false);
  };

  const fetchMaterials = async (status: "pending" | "approved" | "rejected") => {
    setLoadingMaterials(true);
    const { data, error } = await supabase
      .from("materials")
      .select("id, title, description, type, status, file_url, created_at, uploaded_by, rejection_reason, courses(code, title), profiles!materials_uploaded_by_fkey(display_name)")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      const { data: fallbackData } = await supabase
        .from("materials")
        .select("id, title, description, type, status, file_url, created_at, uploaded_by, rejection_reason, courses(code, title)")
        .eq("status", status)
        .order("created_at", { ascending: false });
      setMaterials((fallbackData as any) || []);
    } else {
      setMaterials((data as any) || []);
    }
    setLoadingMaterials(false);
  };

  const updateStatus = async (
    id: string,
    status: "approved" | "rejected",
    rejection_reason?: string | null
  ) => {
    setUpdatingId(id);
    const payload: any = { status };
    if (status === "rejected") payload.rejection_reason = rejection_reason ?? null;
    if (status === "approved") payload.rejection_reason = null;
    const { error } = await supabase.from("materials").update(payload).eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title:
          status === "approved"
            ? "Material Approved"
            : rejection_reason && materials.find((m) => m.id === id)?.status === "approved"
            ? "Approval Revoked"
            : "Material Rejected",
      });
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      fetchStats();
    }
    setUpdatingId(null);
  };

  const submitRejection = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast({ title: "Reason required", description: "Please provide feedback for the uploader.", variant: "destructive" });
      return;
    }
    await updateStatus(rejectTarget.id, "rejected", rejectReason.trim());
    setRejectTarget(null);
    setRejectReason("");
  };

  const fetchUserProfiles = async (status: "pending" | "approved" | "rejected") => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*, universities(name, short_name), departments(name), levels(name)")
      .eq("verification_status", status)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching profiles", description: error.message, variant: "destructive" });
      setUserProfiles([]);
    } else {
      setUserProfiles((data as any) || []);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (!authLoading && user && section === "verify_profiles") {
      fetchUserProfiles(userSubTab);
    }
  }, [user, authLoading, section, userSubTab]);

  const updateProfileStatus = async (
    profileId: string,
    status: "approved" | "rejected",
    rejectionReason?: string | null
  ) => {
    setUpdatingUserId(profileId);
    const payload: any = { verification_status: status };
    if (status === "rejected") {
      payload.verification_rejection_reason = rejectionReason ?? null;
    } else {
      payload.verification_rejection_reason = null;
    }

    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", profileId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: status === "approved" ? "Profile Verified" : "Profile Verification Rejected",
        description: status === "approved" ? "The user can now upload materials." : "Notification/rejection reason sent.",
      });
      setUserProfiles((prev) => prev.filter((p) => p.id !== profileId));
      fetchStats();
    }
    setUpdatingUserId(null);
  };

  const submitProfileRejection = async () => {
    if (!profileRejectTarget) return;
    if (!profileRejectReason.trim()) {
      toast({ title: "Reason required", description: "Please provide feedback for the user.", variant: "destructive" });
      return;
    }
    await updateProfileStatus(profileRejectTarget.id, "rejected", profileRejectReason.trim());
    setProfileRejectTarget(null);
    setProfileRejectReason("");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const navItems: { key: Section; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "pending", label: "Pending Review", icon: Clock, badge: stats.pending },
    { key: "approved", label: "Approved", icon: FileCheck, badge: stats.approved },
    { key: "rejected", label: "Rejected", icon: FileX, badge: stats.rejected },
    { key: "verify_profiles", label: "Verify Profiles", icon: Users, badge: stats.pendingUsers },
  ];

  const statCards = [
    { label: "Total Materials", value: stats.total, icon: Files, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-gold", bg: "bg-gold/10" },
    { label: "Approved", value: stats.approved, icon: FileCheck, color: "text-primary", bg: "bg-primary/10" },
    { label: "Rejected", value: stats.rejected, icon: FileX, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Total Users", value: stats.users, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending Verifications", value: stats.pendingUsers, icon: CheckCircle, color: "text-gold", bg: "bg-gold/10" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage course materials and monitor activity</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar nav */}
          <aside className="space-y-1 rounded-xl border border-border bg-card p-2 h-fit">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  section === item.key
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant={section === item.key ? "secondary" : "outline"} className="h-5 px-1.5 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </aside>

          {/* Content */}
          <section>
            {section === "verify_profiles" ? (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-foreground">User Profile Verification</h2>
                
                {/* User subtabs */}
                <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
                  {(["pending", "approved", "rejected"] as const).map((tab) => (
                    <Button
                      key={tab}
                      variant={userSubTab === tab ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUserSubTab(tab)}
                      className="capitalize"
                    >
                      {tab} ({
                        tab === "pending" ? stats.pendingUsers :
                        tab === "approved" ? "Verified" : "Rejected"
                      })
                    </Button>
                  ))}
                </div>

                {loadingUsers ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : userProfiles.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-12 text-center">
                    <p className="text-muted-foreground">No {userSubTab} profiles found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userProfiles.map((p) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-border bg-card p-5"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-foreground break-words">{p.display_name}</h3>
                              <span className="text-xs text-muted-foreground">Joined {new Date(p.created_at).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                              <div className="break-words">University: <strong className="text-foreground">{p.universities?.name || "—"}</strong></div>
                              <div className="break-words">Department: <strong className="text-foreground">{p.departments?.name || "—"}</strong></div>
                              <div className="break-words">Level: <strong className="text-foreground">{p.levels?.name || "—"}</strong></div>
                            </div>

                            {/* Identification ID Document preview */}
                            {p.identification_url && (
                              <div className="mt-4 w-full max-w-sm overflow-hidden rounded-lg border border-border bg-secondary/10">
                                {p.identification_url.toLowerCase().endsWith(".pdf") ? (
                                  <div className="flex items-center gap-3 p-4">
                                    <FileText className="h-8 w-8 text-primary" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium text-foreground truncate">PDF Identification Document</p>
                                      <p className="text-[10px] text-muted-foreground">Click View to open</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative group">
                                    <img
                                      src={p.identification_url}
                                      alt="Student ID card or admission letter preview"
                                      className="max-h-48 w-full object-contain bg-black/5"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 md:justify-end md:shrink-0">
                            {p.identification_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={p.identification_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="mr-1 h-3 w-3" /> View ID
                                </a>
                              </Button>
                            )}

                            {userSubTab === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateProfileStatus(p.id, "approved")}
                                  disabled={updatingUserId === p.id}
                                  className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                  {updatingUserId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                  Verify
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setProfileRejectTarget({ id: p.id, display_name: p.display_name })}
                                  disabled={updatingUserId === p.id}
                                  className="gap-1"
                                >
                                  {updatingUserId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                  Reject…
                                </Button>
                              </>
                            )}

                            {userSubTab === "approved" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setProfileRejectTarget({ id: p.id, display_name: p.display_name })}
                                disabled={updatingUserId === p.id}
                                className="gap-1"
                              >
                                {updatingUserId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                Reject / Revoke
                              </Button>
                            )}

                            {userSubTab === "rejected" && (
                              <Button
                                size="sm"
                                onClick={() => updateProfileStatus(p.id, "approved")}
                                disabled={updatingUserId === p.id}
                                className="gap-1"
                              >
                                {updatingUserId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                Verify / Approve
                              </Button>
                            )}
                          </div>
                        </div>

                        {userSubTab === "rejected" && p.verification_rejection_reason && (
                          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-foreground">
                            <span className="font-semibold text-destructive">Rejection reason:</span> {p.verification_rejection_reason}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ) : section === "overview" ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {statCards.map((s) => (
                    <Card key={s.label}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                          <s.icon className={`h-4 w-4 ${s.color}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                          {loadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : s.value}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Button onClick={() => setSection("pending")} className="gap-1.5">
                      <Clock className="h-4 w-4" /> Review Pending ({stats.pending})
                    </Button>
                    <Button variant="outline" onClick={() => setSection("verify_profiles")} className="gap-1.5 border-gold text-gold hover:bg-gold/10 hover:text-gold">
                      <Users className="h-4 w-4" /> Verify Profiles ({stats.pendingUsers})
                    </Button>
                    <Button variant="outline" onClick={() => setSection("approved")} className="gap-1.5">
                      <FileCheck className="h-4 w-4" /> View Approved
                    </Button>
                    <Button variant="outline" onClick={() => setSection("rejected")} className="gap-1.5">
                      <FileX className="h-4 w-4" /> View Rejected
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div>
                <h2 className="mb-4 text-xl font-semibold capitalize text-foreground">{section} Materials</h2>
                {loadingMaterials ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : materials.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-12 text-center">
                    <p className="text-muted-foreground">No {section} materials found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {materials.map((material) => {
                      const TypeIcon = typeIcons[material.type] || FileText;
                      return (
                        <motion.div
                          key={material.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-border bg-card p-5"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="mb-2 flex items-center gap-2">
                                <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-foreground break-words">{material.title}</h3>
                                <Badge variant="outline" className="capitalize">{material.type}</Badge>
                              </div>
                              {material.description && (
                                <p className="mb-2 text-sm text-muted-foreground">{material.description}</p>
                              )}
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {material.courses && (
                                  <span>Course: <strong>{material.courses.code} – {material.courses.title}</strong></span>
                                )}
                                {(material as any).profiles?.display_name && (
                                  <span>By: <strong>{(material as any).profiles.display_name}</strong></span>
                                )}
                                <span>{new Date(material.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:shrink-0">
                              {material.file_url && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-1 h-3 w-3" /> View
                                  </a>
                                </Button>
                              )}
                              {section === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateStatus(material.id, "approved")}
                                    disabled={updatingId === material.id}
                                    className="gap-1"
                                  >
                                    {updatingId === material.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => { setRejectTarget({ id: material.id, title: material.title, mode: "reject" }); setRejectReason(""); }}
                                    disabled={updatingId === material.id}
                                    className="gap-1"
                                  >
                                    {updatingId === material.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                    Reject…
                                  </Button>
                                </>
                              )}
                              {section === "approved" && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => { setRejectTarget({ id: material.id, title: material.title, mode: "revoke" }); setRejectReason(""); }}
                                  disabled={updatingId === material.id}
                                  className="gap-1"
                                >
                                  {updatingId === material.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                                  Revoke
                                </Button>
                              )}
                              {section === "rejected" && (
                                <Button
                                  size="sm"
                                  onClick={() => updateStatus(material.id, "approved")}
                                  disabled={updatingId === material.id}
                                  className="gap-1"
                                >
                                  {updatingId === material.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                  Approve
                                </Button>
                              )}
                            </div>
                          </div>
                          {section === "rejected" && material.rejection_reason && (
                            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-foreground">
                              <span className="font-semibold text-destructive">Feedback to uploader:</span> {material.rejection_reason}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />

      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rejectTarget?.mode === "revoke" ? "Revoke approval" : "Reject material"}
            </DialogTitle>
            <DialogDescription>
              {rejectTarget?.mode === "revoke"
                ? `"${rejectTarget?.title}" will be unpublished. Tell the uploader why so they can fix and resubmit.`
                : `Provide feedback so the uploader of "${rejectTarget?.title}" knows what to improve.`}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Document is blurry, please re-scan and upload again."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={submitRejection} disabled={!!updatingId}>
              {updatingId ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
              {rejectTarget?.mode === "revoke" ? "Revoke & notify" : "Reject & notify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!profileRejectTarget} onOpenChange={(o) => { if (!o) { setProfileRejectTarget(null); setProfileRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Profile Verification</DialogTitle>
            <DialogDescription>
              Provide feedback to {profileRejectTarget?.display_name} explaining why their verification was rejected.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={profileRejectReason}
            onChange={(e) => setProfileRejectReason(e.target.value)}
            placeholder="e.g. Student ID is expired or names do not match. Please upload a valid ID."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setProfileRejectTarget(null); setProfileRejectReason(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={submitProfileRejection} disabled={!!updatingUserId}>
              {updatingUserId ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
              Reject Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
