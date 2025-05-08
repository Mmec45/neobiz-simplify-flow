
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { BarChart3, PlusCircle, ArrowUpCircle, ArrowDownCircle, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const transactionFormSchema = z.object({
  amount: z.string().min(1, "Le montant est requis"),
  type: z.string(),
  description: z.string().optional(),
  category: z.string().min(1, "La catégorie est requise"),
  transaction_date: z.string().optional(),
});

const categoryFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.string().min(1, "Le type est requis"),
  color: z.string().optional(),
});

const Finance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [period, setPeriod] = useState('month');
  const [reportData, setReportData] = useState<any>({});
  
  const transactionForm = useForm<z.infer<typeof transactionFormSchema>>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      amount: "",
      type: "expense",
      description: "",
      category: "",
      transaction_date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const categoryForm = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      type: "expense",
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
    },
  });

  // Fetch transactions and categories
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [transactionsResult, categoriesResult] = await Promise.all([
          supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('transaction_date', { ascending: false }),
            
          supabase
            .from('financial_categories')
            .select('*')
            .eq('user_id', user.id)
        ]);
        
        if (transactionsResult.error) throw transactionsResult.error;
        if (categoriesResult.error) throw categoriesResult.error;
        
        setTransactions(transactionsResult.data || []);
        setCategories(categoriesResult.data || []);
        
        generateReports(transactionsResult.data || [], categoriesResult.data || [], period);
      } catch (error) {
        console.error('Error fetching financial data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données financières",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, toast, period]);
  
  const onTransactionSubmit = async (values: z.infer<typeof transactionFormSchema>) => {
    try {
      // Fix: ensure required fields are defined
      const transactionData = {
        user_id: user?.id,
        amount: parseFloat(values.amount),
        type: values.type,
        description: values.description,
        category: values.category,
        transaction_date: values.transaction_date || format(new Date(), "yyyy-MM-dd"),
      };
      
      // Validate required fields before insertion
      if (!transactionData.amount || !transactionData.type || !transactionData.category) {
        throw new Error("Missing required fields");
      }
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: transactionData.user_id,
          amount: transactionData.amount,
          type: transactionData.type,
          description: transactionData.description,
          category: transactionData.category,
          transaction_date: transactionData.transaction_date,
        });
        
      if (error) throw error;
      
      // Refresh transactions
      const { data: updatedTransactions, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('transaction_date', { ascending: false });
        
      if (fetchError) throw fetchError;
      
      setTransactions(updatedTransactions || []);
      generateReports(updatedTransactions || [], categories, period);
      setOpenTransactionDialog(false);
      transactionForm.reset({
        amount: "",
        type: "expense",
        description: "",
        category: "",
        transaction_date: format(new Date(), "yyyy-MM-dd"),
      });
      
      toast({
        title: "Succès",
        description: "Transaction enregistrée avec succès",
      });
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la transaction",
        variant: "destructive",
      });
    }
  };
  
  const onCategorySubmit = async (values: z.infer<typeof categoryFormSchema>) => {
    try {
      // Fix: ensure required fields are defined
      const categoryData = {
        user_id: user?.id,
        name: values.name,
        type: values.type,
        color: values.color,
      };
      
      // Validate required fields before insertion
      if (!categoryData.name || !categoryData.type) {
        throw new Error("Missing required fields");
      }
      
      const { error } = await supabase
        .from('financial_categories')
        .insert({
          user_id: categoryData.user_id,
          name: categoryData.name,
          type: categoryData.type,
          color: categoryData.color,
        });
        
      if (error) throw error;
      
      // Refresh categories
      const { data: updatedCategories, error: fetchError } = await supabase
        .from('financial_categories')
        .select('*')
        .eq('user_id', user?.id);
        
      if (fetchError) throw fetchError;
      
      setCategories(updatedCategories || []);
      setOpenCategoryDialog(false);
      categoryForm.reset({
        name: "",
        type: "expense",
        color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      });
      
      toast({
        title: "Succès",
        description: "Catégorie créée avec succès",
      });
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la catégorie",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      const updatedTransactions = transactions.filter(transaction => transaction.id !== id);
      setTransactions(updatedTransactions);
      generateReports(updatedTransactions, categories, period);
      
      toast({
        title: "Succès",
        description: "Transaction supprimée avec succès",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la transaction",
        variant: "destructive",
      });
    }
  };

  const generateReports = (transactions: any[], categories: any[], period: string) => {
    // Calculate financial summary
    let income = 0;
    let expense = 0;
    let filteredTransactions = [...transactions];
    
    // Filter transactions based on period
    const now = new Date();
    
    if (period === 'month') {
      // Current month
      const startOfMonthDate = startOfMonth(now);
      const endOfMonthDate = endOfMonth(now);
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate >= startOfMonthDate && transactionDate <= endOfMonthDate;
      });
    } else if (period === '3months') {
      // Last 3 months
      const threeMonthsAgo = subMonths(now, 3);
      filteredTransactions = transactions.filter(t => new Date(t.transaction_date) >= threeMonthsAgo);
    } else if (period === '6months') {
      // Last 6 months
      const sixMonthsAgo = subMonths(now, 6);
      filteredTransactions = transactions.filter(t => new Date(t.transaction_date) >= sixMonthsAgo);
    }
    
    // Calculate total income and expense
    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'income') {
        income += transaction.amount;
      } else {
        expense += transaction.amount;
      }
    });
    
    // Generate category data for charts
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};
    const categoryColors: Record<string, string> = {};
    
    // Initialize with all categories
    categories.forEach(cat => {
      if (cat.type === 'income') {
        incomeByCategory[cat.name] = 0;
      } else {
        expenseByCategory[cat.name] = 0;
      }
      categoryColors[cat.name] = cat.color || '#' + Math.floor(Math.random() * 16777215).toString(16);
    });
    
    // Sum up transactions by category
    filteredTransactions.forEach(transaction => {
      const { category, amount, type } = transaction;
      if (type === 'income' && incomeByCategory.hasOwnProperty(category)) {
        incomeByCategory[category] += amount;
      } else if (type === 'expense' && expenseByCategory.hasOwnProperty(category)) {
        expenseByCategory[category] += amount;
      }
    });
    
    // Convert to chart data format
    const incomeChartData = Object.keys(incomeByCategory).map(category => ({
      name: category,
      value: incomeByCategory[category],
      color: categoryColors[category]
    })).filter(item => item.value > 0);
    
    const expenseChartData = Object.keys(expenseByCategory).map(category => ({
      name: category,
      value: expenseByCategory[category],
      color: categoryColors[category]
    })).filter(item => item.value > 0);
    
    // Monthly trend data (for bar chart)
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthName = format(month, 'MMM');
      
      let monthIncome = 0;
      let monthExpense = 0;
      
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.transaction_date);
        if (transactionDate >= monthStart && transactionDate <= monthEnd) {
          if (transaction.type === 'income') {
            monthIncome += transaction.amount;
          } else {
            monthExpense += transaction.amount;
          }
        }
      });
      
      return {
        month: monthName,
        income: monthIncome,
        expense: monthExpense,
        balance: monthIncome - monthExpense
      };
    });
    
    // Set report data
    setReportData({
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      incomeChartData,
      expenseChartData,
      monthlyData
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Finances</h1>
      
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Revenus</CardTitle>
            <CardDescription>Total des revenus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {reportData.totalIncome?.toLocaleString() || 0} €
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Dialog open={openTransactionDialog && transactionForm.getValues('type') === 'income'} 
                   onOpenChange={(open) => {
                     if (open) {
                       transactionForm.setValue('type', 'income');
                     }
                     setOpenTransactionDialog(open);
                   }}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter un revenu
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardFooter>
        </Card>
        
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Dépenses</CardTitle>
            <CardDescription>Total des dépenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {reportData.totalExpense?.toLocaleString() || 0} €
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Dialog open={openTransactionDialog && transactionForm.getValues('type') === 'expense'} 
                   onOpenChange={(open) => {
                     if (open) {
                       transactionForm.setValue('type', 'expense');
                     }
                     setOpenTransactionDialog(open);
                   }}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter une dépense
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardFooter>
        </Card>
        
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Balance</CardTitle>
            <CardDescription>Revenus - Dépenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${reportData.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {reportData.balance?.toLocaleString() || 0} €
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Dialog open={openCategoryDialog} onOpenChange={setOpenCategoryDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter une catégorie
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
      
      <Dialog open={openTransactionDialog} onOpenChange={setOpenTransactionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {transactionForm.getValues('type') === 'income' ? 'Ajouter un revenu' : 'Ajouter une dépense'}
            </DialogTitle>
            <DialogDescription>
              Enregistrez une nouvelle transaction dans votre suivi financier.
            </DialogDescription>
          </DialogHeader>
          <Form {...transactionForm}>
            <form onSubmit={transactionForm.handleSubmit(onTransactionSubmit)} className="space-y-4">
              <FormField
                control={transactionForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant (€)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={transactionForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories
                          .filter(cat => cat.type === transactionForm.getValues('type'))
                          .map(category => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {categories.filter(cat => cat.type === transactionForm.getValues('type')).length === 0 && (
                      <FormDescription className="text-yellow-500">
                        Aucune catégorie disponible. Créez-en une d'abord.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={transactionForm.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={transactionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Description de la transaction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={openCategoryDialog} onOpenChange={setOpenCategoryDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter une catégorie</DialogTitle>
            <DialogDescription>
              Créez une nouvelle catégorie pour classer vos transactions.
            </DialogDescription>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la catégorie</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Alimentation, Loyer, Salaire..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={categoryForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Revenu</SelectItem>
                        <SelectItem value="expense">Dépense</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={categoryForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 items-center">
                        <Input type="color" {...field} className="w-12 h-10" />
                        <div className="text-sm">{field.value}</div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Créer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Analyse des dépenses et revenus</CardTitle>
              
              <Select value={period} onValueChange={(value) => {
                setPeriod(value);
                generateReports(transactions, categories, value);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="3months">Derniers 3 mois</SelectItem>
                  <SelectItem value="6months">Derniers 6 mois</SelectItem>
                  <SelectItem value="all">Toutes les données</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="bar" className="space-y-4">
              <TabsList>
                <TabsTrigger value="bar">Évolution</TabsTrigger>
                <TabsTrigger value="expense">Dépenses</TabsTrigger>
                <TabsTrigger value="income">Revenus</TabsTrigger>
              </TabsList>
              
              <TabsContent value="bar" className="space-y-4">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString()} €`} />
                      <Legend />
                      <Bar dataKey="income" name="Revenus" fill="#22c55e" />
                      <Bar dataKey="expense" name="Dépenses" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="expense" className="space-y-4">
                {reportData.expenseChartData?.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.expenseChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={1}
                          dataKey="value"
                          nameKey="name"
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {reportData.expenseChartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${Number(value).toLocaleString()} €`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Aucune donnée de dépense disponible pour cette période
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="income" className="space-y-4">
                {reportData.incomeChartData?.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.incomeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={1}
                          dataKey="value"
                          nameKey="name"
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {reportData.incomeChartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${Number(value).toLocaleString()} €`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Aucune donnée de revenu disponible pour cette période
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions récentes</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="max-h-[400px] overflow-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune transaction enregistrée
                </div>
              ) : (
                <div className="space-y-1">
                  {transactions.slice(0, 10).map(transaction => (
                    <div 
                      key={transaction.id} 
                      className="flex justify-between items-center px-6 py-2 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {transaction.type === 'income' ? (
                            <ArrowUpCircle className="h-4 w-4" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{transaction.category}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.description || 'Aucune description'} • {new Date(transaction.transaction_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'} {transaction.amount.toLocaleString()} €
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <Trash className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Finance;
