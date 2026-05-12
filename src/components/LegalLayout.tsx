import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface LegalLayoutProps {
  title: string;
  updated: string;
  intro?: string;
  children: ReactNode;
}

const LegalLayout = ({ title, updated, intro, children }: LegalLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: {updated}</p>
          {intro && <p className="mt-4 text-base text-muted-foreground">{intro}</p>}
        </header>
        <article className="prose prose-sm sm:prose-base max-w-none space-y-6 text-foreground [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ul]:text-muted-foreground [&_a]:text-primary [&_a]:underline">
          {children}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default LegalLayout;