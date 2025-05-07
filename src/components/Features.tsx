
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      id: 1,
      title: "Facturation automatisée",
      description: "Créez, envoyez et suivez automatiquement vos factures. Programmez des rappels et recevez des alertes pour les paiements en retard.",
      icon: "📃",
    },
    {
      id: 2,
      title: "Gestion de la clientèle",
      description: "Centralisez les informations de vos clients et suivez l'historique complet des interactions pour un service personnalisé.",
      icon: "👥",
    },
    {
      id: 3,
      title: "Tableaux de bord financiers",
      description: "Visualisez vos performances financières en temps réel avec des graphiques et indicateurs clairs et personnalisables.",
      icon: "📊",
    },
    {
      id: 4,
      title: "Assistant IA",
      description: "Profitez de recommandations intelligentes et d'automatisations basées sur l'IA pour améliorer votre productivité.",
      icon: "🤖",
    },
  ];

  return (
    <section id="features" className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
            Fonctionnalités conçues pour votre succès
          </h2>
          <p className="text-text-muted">
            NeoBiz regroupe tous les outils dont vous avez besoin pour gérer votre entreprise efficacement,
            au sein d'une plateforme simple et intuitive.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <Card key={feature.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-text-muted">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
