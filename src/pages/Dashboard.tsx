
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon, Clock, Calendar } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [financialSummary, setFinancialSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    pendingInvoices: 0,
    pendingAmount: 0,
  });
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch financial data
        const { data: incomeData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('type', 'income');
        
        const { data: expensesData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('type', 'expense');
          
        const { data: pendingInvoices } = await supabase
          .from('invoices')
          .select('amount')
          .eq('user_id', user.id)
          .eq('status', 'pending');
          
        // Calculate totals
        const totalIncome = incomeData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
        const totalExpenses = expensesData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
        const pendingAmount = pendingInvoices?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
        
        setFinancialSummary({
          totalIncome,
          totalExpenses,
          pendingInvoices: pendingInvoices?.length || 0,
          pendingAmount,
        });
        
        // Fetch upcoming tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'completed')
          .order('due_date', { ascending: true })
          .limit(5);
          
        setUpcomingTasks(tasks || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const priorityColors = {
    low: "bg-blue-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
      <p className="text-gray-500">
        Bienvenue {user?.user_metadata?.full_name || "Utilisateur"}, voici un aperçu de votre activité.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary.totalIncome.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">
              +0% depuis le mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses totales</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary.totalExpenses.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">
              +0% depuis le mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures en attente</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {financialSummary.pendingAmount.toFixed(2)} € à encaisser
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches à faire</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingTasks.filter(task => task.priority === 'urgent').length} tâches urgentes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tâches à venir</CardTitle>
            <CardDescription>
              Vos prochaines échéances et tâches prioritaires
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune tâche en cours.</p>
            ) : (
              upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className={`h-2 w-2 rounded-full ${priorityColors[task.priority as keyof typeof priorityColors]}`} />
                  <div className="flex-1 space-y-1">
                    <p className="font-medium leading-none">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Pas de date limite'}
                    </p>
                  </div>
                  <Badge variant={task.status === 'in_progress' ? 'secondary' : 'outline'}>
                    {task.status === 'todo' ? 'À faire' : 'En cours'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" onClick={() => window.location.href = "/tasks"}>
              Voir toutes les tâches
            </Button>
          </CardFooter>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Conseils IA</CardTitle>
            <CardDescription>
              Recommandations personnalisées pour votre entreprise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium">Relance de paiement</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Vous avez {financialSummary.pendingInvoices} factures en attente de paiement. Nous vous recommandons d'envoyer des rappels aux clients concernés.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium">Optimisation fiscale</h3>
              <p className="text-sm text-muted-foreground mt-1">
                La fin du trimestre approche, pensez à préparer vos déclarations fiscales et vérifier vos dépenses déductibles.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" onClick={() => window.location.href = "/ai-assistant"}>
              Obtenir plus de conseils
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accès rapides</CardTitle>
          <CardDescription>
            Les fonctionnalités les plus utilisées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Button onClick={() => window.location.href = "/invoices/new"} variant="outline" className="h-24 flex-col">
              <FileInvoice className="h-8 w-8 mb-2" />
              <span>Créer une facture</span>
            </Button>
            <Button onClick={() => window.location.href = "/tasks/new"} variant="outline" className="h-24 flex-col">
              <ClipboardList className="h-8 w-8 mb-2" />
              <span>Nouvelle tâche</span>
            </Button>
            <Button onClick={() => window.location.href = "/ai-assistant"} variant="outline" className="h-24 flex-col">
              <PenTool className="h-8 w-8 mb-2" />
              <span>Rédiger avec IA</span>
            </Button>
            <Button onClick={() => window.location.href = "/finances/new"} variant="outline" className="h-24 flex-col">
              <BarChart3 className="h-8 w-8 mb-2" />
              <span>Saisir une dépense</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
