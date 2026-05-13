import { BookOpen, Mail, Phone, MapPin } from "lucide-react";
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
              <a href="https://x.com/courseconnectng" target="_blank" rel="noopener noreferrer" aria-label="X" className="opacity-90 hover:opacity-100 transition-opacity">
                {/* X logo */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="#000000" d="M18.244 2H21.5l-7.5 8.575L23 22h-6.94l-5.43-7.09L4.4 22H1.14l8.04-9.19L1 2h7.09l4.91 6.49L18.244 2zm-1.22 18h1.92L7.06 4H5.02l11.99 16z"/>
                </svg>
              </a>
              <a href="https://instagram.com/courseconnectng" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="opacity-90 hover:opacity-100 transition-opacity">
                {/* Instagram logo */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <defs>
                    <radialGradient id="ig-grad" cx="30%" cy="110%" r="130%">
                      <stop offset="0%" stopColor="#FFD776"/>
                      <stop offset="25%" stopColor="#F09433"/>
                      <stop offset="50%" stopColor="#E6683C"/>
                      <stop offset="75%" stopColor="#DC2743"/>
                      <stop offset="100%" stopColor="#BC1888"/>
                    </radialGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)"/>
                  <path fill="none" stroke="#fff" strokeWidth="1.8" d="M12 7.8a4.2 4.2 0 100 8.4 4.2 4.2 0 000-8.4z"/>
                  <circle cx="17.3" cy="6.7" r="1" fill="#fff"/>
                </svg>
              </a>
              <a href="https://facebook.com/courseconnectng" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="opacity-90 hover:opacity-100 transition-opacity">
                {/* Facebook logo */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="#1877F2" d="M24 12a12 12 0 10-13.875 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.313 0 2.686.235 2.686.235v2.953H15.83c-1.49 0-1.955.925-1.955 1.874V12h3.328l-.532 3.47h-2.796v8.384A12.003 12.003 0 0024 12z"/>
                </svg>
              </a>
              <a href="https://linkedin.com/company/courseconnectng" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="opacity-90 hover:opacity-100 transition-opacity">
                {/* LinkedIn logo */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="#0A66C2" d="M20.452 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.94v5.666H9.356V9h3.414v1.561h.049c.476-.9 1.637-1.852 3.37-1.852 3.602 0 4.268 2.37 4.268 5.455v6.288zM5.337 7.433a2.063 2.063 0 11-.001-4.126 2.063 2.063 0 01.001 4.126zM7.114 20.452H3.558V9h3.556v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="https://tiktok.com/@courseconnectng" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="opacity-90 hover:opacity-100 transition-opacity">
                {/* TikTok logo */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="#25F4EE" d="M16.5 6.6a5.7 5.7 0 01-1-.6v8.5a5.6 5.6 0 11-5.6-5.6c.2 0 .4 0 .6.05v2.9a2.7 2.7 0 102 2.6V2h2.8a4.6 4.6 0 004.6 4.6v0z" transform="translate(-1 1)"/>
                  <path fill="#FE2C55" d="M17.5 5.6a5.7 5.7 0 01-1-.6v8.5a5.6 5.6 0 11-5.6-5.6c.2 0 .4 0 .6.05v2.9a2.7 2.7 0 102 2.6V1h2.8a4.6 4.6 0 004.6 4.6v0z" transform="translate(1 -1)"/>
                  <path fill="#000" d="M17 6a5.7 5.7 0 01-1-.6v8.5a5.6 5.6 0 11-5.6-5.6c.2 0 .4 0 .6.05v2.9a2.7 2.7 0 102 2.6V2h2.8A4.6 4.6 0 0017 6z"/>
                </svg>
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
