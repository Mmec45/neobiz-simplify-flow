
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { AreaChart, BarChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Filter, Wallet, ArrowUpRight, ArrowDownRight, ChartPie, CircleDollarSign } from 'lucide-react';

// Définir le schéma pour la création/modification de transactions
const transactionSchema = z.object({
  amount: z.string().min(1, "Le montant est requis"),
  category: z.string().min(1, "La catégorie est requise"),
  type: z.string().min(1, "Le type est requis"),
  description: z.string().optional(),
  transaction_date: z.string().min(1, "La date est requise"),
});

// Définir le schéma pour la création/modification de catégories
const categorySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.string().min(1, "Le type est requis"),
  color: z.string().min(1, "La couleur est requise"),
});

const Finance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [timeRange, setTimeRange] = useState('month');
  const [financialSummary, setFinancialSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyBalance: 0,
  });
  
  const transactionForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: "",
      category: "",
      type: "expense",
      description: "",
      transaction_date: format(new Date(), "yyyy-MM-dd"),
    },
  });
  
  const categoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "expense",
      color: "#9b87f5",
    },
  });

  // Fetch transactions and categories
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('financial_categories')
          .select('*')
          .eq('user_id', user.id);
          
        if (categoriesError) throw categoriesError;
        
        setCategories(categoriesData || []);
        
        // Fetch transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .order('transaction_date', { ascending: false });
          
        if (transactionsError) throw transactionsError;
        
        setTransactions(transactionsData || []);
        
        // Calculate financial summary
        calculateFinancialSummary(transactionsData || []);
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
  }, [user, toast]);

  // Calculate financial summary
  const calculateFinancialSummary = (transactionsData: any[]) => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    
    const totalIncome = transactionsData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const totalExpenses = transactionsData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const monthlyTransactions = transactionsData.filter(t => 
      new Date(t.transaction_date) >= currentMonthStart
    );
    
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    setFinancialSummary({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance: monthlyIncome - monthlyExpenses,
    });
  };

  // Submit transaction form
  const onTransactionSubmit = async (values: z.infer<typeof transactionSchema>) => {
    try {
      const transactionData = {
        ...values,
        user_id: user?.id,
        amount: parseFloat(values.amount),
      };
      
      const { error } = await supabase
        .from('transactions')
        .insert(transactionData);
        
      if (error) throw error;
      
      // Refresh transactions
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
        
      setTransactions(data || []);
      calculateFinancialSummary(data || []);
      setOpenTransactionDialog(false);
      transactionForm.reset({
        amount: "",
        category: "",
        type: "expense",
        description: "",
        transaction_date: format(new Date(), "yyyy-MM-dd"),
      });
      
      toast({
        title: "Succès",
        description: "Transaction créée avec succès",
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la transaction",
        variant: "destructive",
      });
    }
  };

  // Submit category form
  const onCategorySubmit = async (values: z.infer<typeof categorySchema>) => {
    try {
      const categoryData = {
        ...values,
        user_id: user?.id,
      };
      
      const { error } = await supabase
        .from('financial_categories')
        .insert(categoryData);
        
      if (error) throw error;
      
      // Refresh categories
      const { data } = await supabase
        .from('financial_categories')
        .select('*');
        
      setCategories(data || []);
      setOpenCategoryDialog(false);
      categoryForm.reset({
        name: "",
        type: "expense",
        color: "#9b87f5",
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

  // Prepare data for charts
  const getChartData = () => {
    const now = new Date();
    let startDate;
    
    switch(timeRange) {
      case 'year':
        startDate = subMonths(now, 12);
        break;
      case 'quarter':
        startDate = subMonths(now, 3);
        break;
      default:
        startDate = subMonths(now, 1);
    }
    
    const filteredTransactions = transactions.filter(t => 
      new Date(t.transaction_date) >= startDate
    );
    
    // Monthly data for area chart
    const monthlyData = [];
    let currentDate = startDate;
    
    while (currentDate <= now) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const monthLabel = format(currentDate, "MMM yyyy");
      
      const monthIncome = filteredTransactions
        .filter(t => 
          t.type === 'income' &&
          new Date(t.transaction_date) >= monthStart &&
          new Date(t.transaction_date) <= monthEnd
        )
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
      const monthExpenses = filteredTransactions
        .filter(t => 
          t.type === 'expense' &&
          new Date(t.transaction_date) >= monthStart &&
          new Date(t.transaction_date) <= monthEnd
        )
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
      monthlyData.push({
        month: monthLabel,
        revenus: monthIncome,
        dépenses: monthExpenses,
        balance: monthIncome - monthExpenses,
      });
      
      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    }
    
    // Category data for pie chart
    const expensesByCategory = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (!expensesByCategory[t.category]) {
          expensesByCategory[t.category] = 0;
        }
        expensesByCategory[t.category] += parseFloat(t.amount);
      });
      
    const pieChartData = Object.entries(expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b as any).value - (a as any).value);
    
    return {
      monthlyData,
      pieChartData,
    };
  };

  const { monthlyData, pieChartData } = getChartData();
  
  const COLORS = ['#9b87f5', '#7E69AB', '#6E59A5', '#0EA5E9', '#F97316', '#D946EF', '#FEC6A1'];

  if (loading) {
    return <div className="flex justify-center items-center h-full">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tableau financier</h1>
        <div className="flex space-x-2">
          <Dialog open={openCategoryDialog} onOpenChange={setOpenCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle catégorie
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une catégorie</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle catégorie pour vos transactions.
                </DialogDescription>
              </DialogHeader>
              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom de la catégorie" {...field} />
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
                              <SelectValue placeholder="Type de catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="income">Revenus</SelectItem>
                            <SelectItem value="expense">Dépenses</SelectItem>
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
                          <Input type="color" {...field} />
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
          
          <Dialog open={openTransactionDialog} onOpenChange={setOpenTransactionDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une transaction</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle transaction à votre tableau financier.
                </DialogDescription>
              </DialogHeader>
              <Form {...transactionForm}>
                <form onSubmit={transactionForm.handleSubmit(onTransactionSubmit)} className="space-y-4">
                  <FormField
                    control={transactionForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={transactionForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type de transaction" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="income">Revenus</SelectItem>
                            <SelectItem value="expense">Dépenses</SelectItem>
                          </SelectContent>
                        </Select>
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
                              .filter(cat => cat.type === transactionForm.watch('type'))
                              .map((category) => (
                                <SelectItem key={category.id} value={category.name}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            <SelectItem value="Autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
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
                          <Input placeholder="Description (optionnelle)" {...field} />
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
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Solde total
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialSummary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {financialSummary.balance.toLocaleString()} €
            </div>
            <p className="text-xs text-muted-foreground">
              {financialSummary.balance >= 0 ? 'Solde positif' : 'Solde négatif'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenus du mois
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {financialSummary.monthlyIncome.toLocaleString()} €
            </div>
            <p className="text-xs text-muted-foreground">
              Revenus pour {format(new Date(), 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dépenses du mois
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {financialSummary.monthlyExpenses.toLocaleString()} €
            </div>
            <p className="text-xs text-muted-foreground">
              Dépenses pour {format(new Date(), 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Balance mensuelle
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialSummary.monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {financialSummary.monthlyBalance.toLocaleString()} €
            </div>
            <p className="text-xs text-muted-foreground">
              {financialSummary.monthlyBalance >= 0 ? 'Economies' : 'Déficit'} ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-7 md:col-span-5">
              <CardHeader>
                <CardTitle>Revenus et Dépenses</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={timeRange === 'month' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTimeRange('month')}
                  >
                    Mois
                  </Button>
                  <Button 
                    variant={timeRange === 'quarter' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTimeRange('quarter')}
                  >
                    Trimestre
                  </Button>
                  <Button 
                    variant={timeRange === 'year' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTimeRange('year')}
                  >
                    Année
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer config={{ revenus: {}, dépenses: {}, balance: {} }} className="aspect-[3/2]">
                  <AreaChart
                    data={monthlyData}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="revenus" stroke="#9b87f5" fill="#9b87f5" />
                    <Area type="monotone" dataKey="dépenses" stroke="#F97316" fill="#FEC6A1" />
                    <Area type="monotone" dataKey="balance" stroke="#0EA5E9" fill="#D3E4FD" />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="col-span-7 md:col-span-2">
              <CardHeader>
                <CardTitle>Dépenses par catégorie</CardTitle>
                <CardDescription>
                  Distribution des dépenses
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius="70%"
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${parseFloat(value as string).toLocaleString()} €`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Historique des transactions</CardTitle>
              <div className="flex justify-between">
                <CardDescription>
                  Vos dernières transactions
                </CardDescription>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        Aucune transaction trouvée. Créez votre première transaction!
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(parseISO(transaction.transaction_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>
                          {transaction.description || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'} 
                          {parseFloat(transaction.amount).toLocaleString()} €
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right">
                      {financialSummary.balance.toLocaleString()} €
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Finance;
