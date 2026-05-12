import { BookOpen, Mail, Phone, MapPin, Instagram, Twitter, Facebook, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                Course<span className="text-gold">Connect</span>
              </span>
            </Link>
            <p className="mb-4 max-w-xs text-sm text-muted-foreground">
              Connecting Nigerian university students with the course materials they need to succeed. Now live at the University of Lagos.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://twitter.com/courseconnectng" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://instagram.com/courseconnectng" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://facebook.com/courseconnectng" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com/company/courseconnectng" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-3 font-display text-sm font-semibold text-foreground">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/explore" className="hover:text-foreground transition-colors">Browse Materials</Link></li>
              <li><Link to="/upload" className="hover:text-foreground transition-colors">Upload Materials</Link></li>
              <li><Link to="/explore" className="hover:text-foreground transition-colors">Universities</Link></li>
              <li><Link to="/profile" className="hover:text-foreground transition-colors">My Profile</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-display text-sm font-semibold text-foreground">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <a href="mailto:hello@courseconnect.ng" className="hover:text-foreground transition-colors break-all">hello@courseconnect.ng</a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <a href="tel:+2348000000000" className="hover:text-foreground transition-colors">+234 800 000 0000</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Yaba, Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-display text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link to="/community-guidelines" className="hover:text-foreground transition-colors">Community Guidelines</Link></li>
              <li><Link to="/copyright" className="hover:text-foreground transition-colors">Copyright / DMCA</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <p>© {year} CourseConnect Nigeria Ltd. RC: 0000000. All rights reserved.</p>
          <p>Built for Nigerian students, by Nigerian students. 🇳🇬</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
