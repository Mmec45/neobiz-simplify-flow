
import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">NeoBiz</h3>
            <p className="text-sm text-gray-300 mb-4">
              Simplifiez la gestion de votre entreprise grâce à notre plateforme tout-en-un.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-300 hover:text-accent">Accueil</a></li>
              <li><a href="#features" className="text-sm text-gray-300 hover:text-accent">Fonctionnalités</a></li>
              <li><a href="#pricing" className="text-sm text-gray-300 hover:text-accent">Tarifs</a></li>
              <li><a href="#contact" className="text-sm text-gray-300 hover:text-accent">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contactez-nous</h3>
            <ul className="space-y-2">
              <li className="text-sm text-gray-300">contact@neobiz.com</li>
              <li className="text-sm text-gray-300">+33 1 23 45 67 89</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">© {currentYear} NeoBiz. Tous droits réservés.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-accent">
              Mentions légales
            </a>
            <a href="#" className="text-gray-400 hover:text-accent">
              Politique de confidentialité
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
