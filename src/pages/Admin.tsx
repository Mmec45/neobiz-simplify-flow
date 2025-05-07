
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

const Admin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) throw profilesError;
        
        // Fetch invoices
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (invoicesError) throw invoicesError;
        
        setUsers(profilesData || []);
        setInvoices(invoicesData || []);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
      <p className="text-muted-foreground">
        Gérez les utilisateurs et surveillez l'activité de la plateforme.
      </p>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="invoices">Facturation</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs enregistrés</CardTitle>
              <CardDescription>
                Liste de tous les utilisateurs de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name || "Utilisateur sans nom"}</p>
                        <p className="text-sm text-muted-foreground">{user.company_name || "Pas d'entreprise"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'admin' ? "default" : "outline"}>
                        {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                      </Badge>
                      <Button variant="ghost" size="sm">Éditer</Button>
                    </div>
                  </div>
                ))}

                {users.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Aucun utilisateur trouvé
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dernières factures</CardTitle>
              <CardDescription>
                Aperçu des dernières factures créées sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{invoice.client_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Émise le {new Date(invoice.issue_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-medium">{invoice.amount.toFixed(2)} €</p>
                      <Badge variant={
                        invoice.status === 'paid' ? "success" : 
                        invoice.status === 'overdue' ? "destructive" : "outline"
                      }>
                        {invoice.status === 'paid' ? 'Payée' : 
                         invoice.status === 'overdue' ? 'En retard' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                ))}

                {invoices.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Aucune facture trouvée
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques de la plateforme</CardTitle>
              <CardDescription>
                Analyse de l'utilisation et des performances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Utilisateurs</h3>
                  <p className="mt-2 text-3xl font-bold">{users.length}</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Factures</h3>
                  <p className="mt-2 text-3xl font-bold">{invoices.length}</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</h3>
                  <p className="mt-2 text-3xl font-bold">
                    {invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0).toFixed(2)} €
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
