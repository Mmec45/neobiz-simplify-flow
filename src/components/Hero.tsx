
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-white pt-24 pb-16 sm:pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <div className="sm:text-center lg:text-left lg:pr-8 space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary tracking-tight">
              Gérez et développez votre activité en toute simplicité avec NeoBiz.
            </h1>
            <p className="mt-3 text-base md:text-lg text-text-muted md:mt-5 md:max-w-3xl">
              Automatisez votre facturation, optimisez votre suivi client et boostez votre productivité grâce à notre IA intégrée.
            </p>
            <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start gap-4">
              <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white font-semibold">
                Créer un compte gratuit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full mt-3 sm:mt-0 sm:w-auto border-primary text-primary hover:bg-primary hover:text-white font-semibold"
              >
                Demander une démo
              </Button>
            </div>
          </div>
          <div className="mt-12 lg:mt-0 relative flex justify-center">
            <div className="relative w-full max-w-lg">
              {/* Glowing background effect */}
              <div className="absolute top-0 -left-4 w-72 h-72 bg-accent/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute top-0 -right-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
              
              {/* App mockup */}
              <div className="relative shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
                <img
                  className="w-full h-auto"
                  src="https://images.unsplash.com/photo-1531297484001-80022131f5a1"
                  alt="NeoBiz dashboard"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
