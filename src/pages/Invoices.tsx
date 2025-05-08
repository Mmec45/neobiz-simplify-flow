
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Spinner } from "@/components/Spinner";
import { FileText, Plus, Edit, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

// Types
interface Invoice {
  id: string;
  client_name: string;
  client_id?: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  invoice_number?: string;
  description?: string;
  payment_terms?: string;
  notes?: string;
  paid_date?: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

// Schéma de validation pour le formulaire de facture
const invoiceSchema = z.object({
  client_id: z.string().optional(),
  client_name: z.string().min(1, "Le nom du client est requis"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  description: z.string().optional(),
  issue_date: z.string(),
  due_date: z.string(),
  invoice_number: z.string().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
});

// Composant principal de gestion des factures
const Invoices = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Formulaire de création/édition de facture
  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_name: "",
      amount: 0,
      description: "",
      issue_date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      invoice_number: "",
      payment_terms: "30 jours",
      notes: "",
    },
  });
  
  // Récupérer les factures
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) {
        toast.error("Erreur lors du chargement des factures");
        throw error;
      }
      
      return data as Invoice[];
    },
  });
  
  // Récupérer les clients
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email, phone, company");
        
      if (error) {
        console.error("Erreur lors du chargement des clients:", error);
        return [];
      }
      
      return data as Client[];
    },
  });
  
  // Mutation pour créer une facture
  const { mutate: createInvoice, isPending: isCreating } = useMutation({
    mutationFn: async (values: z.infer<typeof invoiceSchema>) => {
      const { data, error } = await supabase
        .from("invoices")
        .insert([{
          user_id: user?.id,
          client_id: values.client_id,
          client_name: values.client_name,
          amount: values.amount,
          description: values.description,
          issue_date: values.issue_date,
          due_date: values.due_date,
          invoice_number: values.invoice_number || `INV-${Date.now().toString().slice(-6)}`,
          payment_terms: values.payment_terms,
          notes: values.notes,
          status: "pending",
        }])
        .select();
        
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      toast.success("Facture créée avec succès");
      setIsCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => {
      toast.error("Erreur lors de la création de la facture");
    },
  });
  
  // Mutation pour mettre à jour une facture
  const { mutate: updateInvoice, isPending: isUpdating } = useMutation({
    mutationFn: async (values: z.infer<typeof invoiceSchema> & { id: string }) => {
      const { id, ...rest } = values;
      const { data, error } = await supabase
        .from("invoices")
        .update(rest)
        .eq("id", id)
        .select();
        
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      toast.success("Facture mise à jour avec succès");
      setIsCreateOpen(false);
      setCurrentInvoice(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de la facture");
    },
  });
  
  // Mutation pour supprimer une facture
  const { mutate: deleteInvoice } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast.success("Facture supprimée avec succès");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de la facture");
    },
  });
  
  // Mutation pour changer le statut d'une facture
  const { mutate: updateInvoiceStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      
      // Si on marque comme payée, ajouter la date de paiement
      if (status === "paid") {
        updates.paid_date = new Date().toISOString().split("T")[0];
      } else if (status === "pending") {
        updates.paid_date = null;
      }
      
      const { data, error } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", id)
        .select();
        
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      toast.success("Statut de la facture mis à jour");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du statut");
    },
  });
  
  // Gérer l'édition d'une facture
  const handleEditInvoice = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    form.reset({
      client_id: invoice.client_id,
      client_name: invoice.client_name,
      amount: invoice.amount,
      description: invoice.description || "",
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      invoice_number: invoice.invoice_number || "",
      payment_terms: invoice.payment_terms || "",
      notes: invoice.notes || "",
    });
    setIsCreateOpen(true);
  };
  
  // Soumettre le formulaire
  const onSubmit = (values: z.infer<typeof invoiceSchema>) => {
    if (currentInvoice) {
      updateInvoice({ id: currentInvoice.id, ...values });
    } else {
      createInvoice(values);
    }
  };
  
  // Filtrer les factures selon l'onglet actif
  const filteredInvoices = invoices?.filter(invoice => {
    switch(activeTab) {
      case "pending":
        return invoice.status === "pending";
      case "paid":
        return invoice.status === "paid";
      case "overdue":
        return invoice.status === "pending" && new Date(invoice.due_date) < new Date();
      default:
        return true;
    }
  });
  
  // Réinitialiser le formulaire lorsqu'on ferme le dialogue
  useEffect(() => {
    if (!isCreateOpen) {
      form.reset();
      setCurrentInvoice(null);
    }
  }, [isCreateOpen, form]);

  // Mettre à jour les champs du client lorsqu'un client est sélectionné
  const handleClientChange = (clientId: string) => {
    const selectedClient = clients?.find(client => client.id === clientId);
    if (selectedClient) {
      form.setValue("client_name", selectedClient.name);
      form.setValue("client_id", clientId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des factures</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos factures, suivez les paiements.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle facture
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{currentInvoice ? "Modifier la facture" : "Créer une nouvelle facture"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {clients && clients.length > 0 && (
                    <div className="col-span-1">
                      <label className="text-sm font-medium">Client existant</label>
                      <Select onValueChange={handleClientChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} {client.company ? `(${client.company})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <FormField
                    control={form.control}
                    name="client_name"
                    render={({ field }) => (
                      <FormItem className={clients && clients.length > 0 ? "col-span-1" : "col-span-2"}>
                        <FormLabel>Nom du client*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nom du client" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoice_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de facture</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Auto-généré si vide" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant*</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issue_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'émission*</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'échéance*</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Description des services ou produits" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="payment_terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conditions de paiement</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: 30 jours" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Notes additionnelles" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isCreating || isUpdating}>
                    {(isCreating || isUpdating) && <Spinner size="sm" className="mr-2" />}
                    {currentInvoice ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="paid">Payées</TabsTrigger>
          <TabsTrigger value="overdue">En retard</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {activeTab === "all" && "Toutes les factures"}
                  {activeTab === "pending" && "Factures en attente"}
                  {activeTab === "paid" && "Factures payées"}
                  {activeTab === "overdue" && "Factures en retard"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Spinner size="lg" />
                </div>
              ) : filteredInvoices && filteredInvoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Numéro</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => {
                      const isOverdue = invoice.status === "pending" && new Date(invoice.due_date) < new Date();
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoice_number || `INV-${invoice.id.slice(-6)}`}
                          </TableCell>
                          <TableCell>{invoice.client_name}</TableCell>
                          <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                          <TableCell className={isOverdue ? "text-red-500 font-medium" : ""}>
                            {new Date(invoice.due_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {invoice.status === "paid" ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="mr-1 h-3 w-3" /> Payée
                                </span>
                              ) : isOverdue ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <XCircle className="mr-1 h-3 w-3" /> En retard
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Clock className="mr-1 h-3 w-3" /> En attente
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditInvoice(invoice)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {invoice.status === "pending" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateInvoiceStatus({ id: invoice.id, status: "paid" })}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateInvoiceStatus({ id: invoice.id, status: "pending" })}
                                >
                                  <XCircle className="h-4 w-4 text-yellow-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
                                    deleteInvoice(invoice.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Aucune facture trouvée dans cette catégorie.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Invoices;
