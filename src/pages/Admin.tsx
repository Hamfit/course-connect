import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, CheckCircle, XCircle, FileText, Video, Image, BookOpen, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  file_url: string | null;
  created_at: string;
  uploaded_by: string;
  courses: { code: string; title: string } | null;
  profiles: { display_name: string } | null;
}

const typeIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  video: Video,
  image: Image,
  text: BookOpen,
};

const AdminPage = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) fetchMaterials();
  }, [user, authLoading, filter]);

  const fetchMaterials = async () => {
    setLoadingMaterials(true);
    const { data, error } = await supabase
      .from("materials")
      .select("*, courses(code, title), profiles!materials_uploaded_by_fkey(display_name)")
      .eq("status", filter)
      .order("created_at", { ascending: false });

    if (error) {
      // Fallback without profile join if foreign key doesn't exist
      const { data: fallbackData } = await supabase
        .from("materials")
        .select("*, courses(code, title)")
        .eq("status", filter)
        .order("created_at", { ascending: false });
      setMaterials((fallbackData as any) || []);
    } else {
      setMaterials((data as any) || []);
    }
    setLoadingMaterials(false);
  };

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("materials")
      .update({ status } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "approved" ? "Material Approved" : "Material Rejected" });
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
    setUpdatingId(null);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Review and moderate uploaded materials</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="mb-6 flex gap-2">
            {(["pending", "approved", "rejected"] as const).map((tab) => (
              <Button
                key={tab}
                variant={filter === tab ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(tab)}
                className="capitalize"
              >
                {tab}
              </Button>
            ))}
          </div>

          {loadingMaterials ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : materials.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No {filter} materials found.</p>
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
                        {filter === "pending" && (
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
                              onClick={() => updateStatus(material.id, "rejected")}
                              disabled={updatingId === material.id}
                              className="gap-1"
                            >
                              {updatingId === material.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
