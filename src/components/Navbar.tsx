
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed w-full bg-white/90 backdrop-blur-sm z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="#" className="flex items-center">
              <span className="text-2xl font-bold text-primary">
                NeoBiz
                <span className="text-accent">.</span>
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-text-muted hover:text-primary transition-colors"
            >
              Fonctionnalités
            </a>
            <a
              href="#solution"
              className="text-text-muted hover:text-primary transition-colors"
            >
              Solutions
            </a>
            <a
              href="#pricing"
              className="text-text-muted hover:text-primary transition-colors"
            >
              Tarifs
            </a>
            <a
              href="#contact"
              className="text-text-muted hover:text-primary transition-colors"
            >
              Contact
            </a>
          </nav>

          {/* CTA Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
              Se connecter
            </Button>
            <Button className="bg-accent hover:bg-accent/90 text-white">
              Essai gratuit
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-primary hover:text-white hover:bg-primary"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 pt-2 pb-4">
            <nav className="flex flex-col space-y-4">
              <a
                href="#features"
                className="px-3 py-2 text-text-muted hover:text-primary hover:bg-secondary rounded-md"
                onClick={toggleMenu}
              >
                Fonctionnalités
              </a>
              <a
                href="#solution"
                className="px-3 py-2 text-text-muted hover:text-primary hover:bg-secondary rounded-md"
                onClick={toggleMenu}
              >
                Solutions
              </a>
              <a
                href="#pricing"
                className="px-3 py-2 text-text-muted hover:text-primary hover:bg-secondary rounded-md"
                onClick={toggleMenu}
              >
                Tarifs
              </a>
              <a
                href="#contact"
                className="px-3 py-2 text-text-muted hover:text-primary hover:bg-secondary rounded-md"
                onClick={toggleMenu}
              >
                Contact
              </a>
              <div className="flex flex-col space-y-2 pt-2">
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
                  Se connecter
                </Button>
                <Button className="w-full bg-accent hover:bg-accent/90 text-white">
                  Essai gratuit
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
