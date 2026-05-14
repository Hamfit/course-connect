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

type Section = "overview" | "pending" | "approved" | "rejected";

const AdminPage = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [section, setSection] = useState<Section>("overview");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0, users: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string; mode: "reject" | "revoke" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!authLoading && user) fetchStats();
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && user && section !== "overview") fetchMaterials(section);
  }, [user, authLoading, section]);

  const fetchStats = async () => {
    setLoadingStats(true);
    const [pending, approved, rejected, total, users] = await Promise.all([
      supabase.from("materials").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("materials").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("materials").select("*", { count: "exact", head: true }).eq("status", "rejected"),
      supabase.from("materials").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);
    setStats({
      pending: pending.count || 0,
      approved: approved.count || 0,
      rejected: rejected.count || 0,
      total: total.count || 0,
      users: users.count || 0,
    });
    setLoadingStats(false);
  };

  const fetchMaterials = async (status: "pending" | "approved" | "rejected") => {
    setLoadingMaterials(true);
    const { data, error } = await supabase
      .from("materials")
      .select("*, courses(code, title), profiles!materials_uploaded_by_fkey(display_name)")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      const { data: fallbackData } = await supabase
        .from("materials")
        .select("*, courses(code, title)")
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
  ];

  const statCards = [
    { label: "Total Materials", value: stats.total, icon: Files, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-gold", bg: "bg-gold/10" },
    { label: "Approved", value: stats.approved, icon: FileCheck, color: "text-primary", bg: "bg-primary/10" },
    { label: "Rejected", value: stats.rejected, icon: FileX, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Total Users", value: stats.users, icon: Users, color: "text-primary", bg: "bg-primary/10" },
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
            {section === "overview" ? (
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
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-foreground">{material.title}</h3>
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

                            <div className="flex items-center gap-2">
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
    </div>
  );
};

export default AdminPage;
