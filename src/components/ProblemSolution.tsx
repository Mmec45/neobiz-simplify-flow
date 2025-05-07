
import { Check, X } from "lucide-react";

const ProblemSolution = () => {
  const problems = [
    {
      id: 1,
      text: "Factures manuelles, pertes de temps.",
    },
    {
      id: 2,
      text: "Suivi client compliqué, relances oubliées.",
    },
    {
      id: 3,
      text: "Absence de vision claire sur les finances.",
    },
  ];

  const solutions = [
    {
      id: 1,
      text: "Automatisation complète de la facturation et des rappels.",
    },
    {
      id: 2,
      text: "Gestion intuitive des clients et suivi simplifié.",
    },
    {
      id: 3,
      text: "Tableaux de bord financiers clairs et accessibles.",
    },
  ];

  return (
    <section id="solution" className="py-16 bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/2 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary">
              Les défis des entrepreneurs
            </h2>
            <p className="text-text-muted mb-8">
              De nombreux entrepreneurs et petites entreprises font face à ces défis quotidiens
              qui freinent leur développement et leur efficacité.
            </p>

            <div className="space-y-4">
              {problems.map((problem) => (
                <div key={problem.id} className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-red-100 flex items-center justify-center mr-3">
                    <X className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="text-text">{problem.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary">
              Comment NeoBiz résout ces problèmes
            </h2>
            <p className="text-text-muted mb-8">
              Notre plateforme a été conçue spécifiquement pour éliminer ces obstacles
              et permettre aux entrepreneurs de se concentrer sur ce qui compte vraiment.
            </p>

            <div className="space-y-4">
              {solutions.map((solution) => (
                <div key={solution.id} className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-text">{solution.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
