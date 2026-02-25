import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Video, Image, BookOpen, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const UploadPage = () => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast({
      title: "Material Submitted!",
      description: "Your material has been submitted for review. Thank you for contributing!",
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Thank You!</h2>
            <p className="mb-6 text-muted-foreground">
              Your material has been submitted for review and will be available soon.
            </p>
            <Button onClick={() => setSubmitted(false)}>Upload Another</Button>
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
            <p className="text-muted-foreground">
              Share your course materials to help fellow students succeed. All uploads are reviewed before publishing.
            </p>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6 rounded-xl border border-border bg-card p-6 sm:p-8"
          >
            {/* University */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">University</label>
              <Select required>
                <SelectTrigger><SelectValue placeholder="Select your university" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unilag">University of Lagos (UNILAG)</SelectItem>
                  <SelectItem value="ui">University of Ibadan (UI)</SelectItem>
                  <SelectItem value="oau">Obafemi Awolowo University (OAU)</SelectItem>
                  <SelectItem value="unn">University of Nigeria, Nsukka (UNN)</SelectItem>
                  <SelectItem value="abu">Ahmadu Bello University (ABU)</SelectItem>
                  <SelectItem value="uniben">University of Benin (UNIBEN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Department</label>
              <Select required>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cs">Computer Science</SelectItem>
                  <SelectItem value="ee">Electrical Engineering</SelectItem>
                  <SelectItem value="med">Medicine & Surgery</SelectItem>
                  <SelectItem value="acc">Accounting</SelectItem>
                  <SelectItem value="eco">Economics</SelectItem>
                  <SelectItem value="law">Law</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Course code */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Course Code</label>
              <Input placeholder="e.g. CSC 201" required />
            </div>

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Material Title</label>
              <Input placeholder="e.g. Data Structures Complete Notes" required />
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
              <Textarea placeholder="Brief description of the material..." rows={3} />
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
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input type="radio" name="type" value={type.value} className="sr-only" />
                    <type.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* File upload area */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Upload File</label>
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 p-8 text-center transition-colors hover:border-primary/50">
                <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="mb-1 text-sm font-medium text-foreground">
                  Drag & drop your file here
                </p>
                <p className="mb-3 text-xs text-muted-foreground">
                  PDF, MP4, JPG, PNG up to 50MB
                </p>
                <Button type="button" variant="outline" size="sm">
                  Browse Files
                </Button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full gap-2">
              <Upload className="h-4 w-4" /> Submit Material
            </Button>
          </motion.form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UploadPage;
