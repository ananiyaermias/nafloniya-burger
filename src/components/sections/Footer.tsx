import { motion } from "framer-motion";

const footerLinks = {
  company: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Blog", href: "#" },
  ],
  resources: [
    { label: "Menu", href: "#" },
    { label: "Locations", href: "#" },
    { label: "Nutrition", href: "#" },
    { label: "FAQ", href: "#" },
  ],
  connect: [
    { label: "Instagram", href: "#" },
    { label: "Twitter", href: "#" },
    { label: "Facebook", href: "#" },
    { label: "Contact", href: "#" },
  ],
};

export const Footer = () => {
  return (
    <footer className="bg-background py-12 sm:py-16 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          {/* Logo & Copyright */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-foreground rounded-xl flex items-center justify-center shadow-elevated">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-background rotate-45"></div>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-foreground">Nafloniya</span>
            </motion.div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              © 2025 Nafloniya Burger. All rights reserved.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Company</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-sm sm:text-base text-muted-foreground hover:text-accent transition-colors touch-target inline-block"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Resources</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-sm sm:text-base text-muted-foreground hover:text-accent transition-colors touch-target inline-block"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect Links */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Connect</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.connect.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-sm sm:text-base text-muted-foreground hover:text-accent transition-colors touch-target inline-block"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};