
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Plus, MoreVertical, Clock, CalendarIcon, UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  FormDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ProjectBoard from '@/components/ProjectBoard';

const formSchema = z.object({
  name: z.string().min(2, "Le nom du projet est requis"),
  description: z.string().optional(),
  status: z.string().default("active"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.string().optional(),
  client_id: z.string().optional(),
});

const Projects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      start_date: "",
      end_date: "",
      budget: "",
      client_id: "",
    },
  });

  // Fetch projects and clients
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*, clients(name)')
          .order('created_at', { ascending: false });
          
        if (projectsError) throw projectsError;
        
        // Fetch clients for the dropdown
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, name');
          
        if (clientsError) throw clientsError;
        
        setProjects(projectsData || []);
        setClients(clientsData || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les projets",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let projectData = {
        ...values,
        budget: values.budget ? parseFloat(values.budget) : null,
        user_id: user?.id,
      };
      
      let response;
      
      if (selectedProject) {
        // Update existing project
        response = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', selectedProject.id)
          .select();
          
        toast({
          title: "Succès",
          description: "Projet mis à jour avec succès",
        });
      } else {
        // Create new project
        response = await supabase
          .from('projects')
          .insert(projectData)
          .select();
          
        toast({
          title: "Succès",
          description: "Projet créé avec succès",
        });
      }
      
      if (response.error) throw response.error;
      
      // Refresh projects
      const { data: updatedProjects } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .order('created_at', { ascending: false });
        
      setProjects(updatedProjects || []);
      setOpen(false);
      form.reset();
      setSelectedProject(null);
      
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le projet",
        variant: "destructive",
      });
    }
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    form.reset({
      name: project.name,
      description: project.description || "",
      status: project.status,
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      budget: project.budget ? String(project.budget) : "",
      client_id: project.client_id || "",
    });
    setOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
        
      if (error) throw error;
      
      setProjects(projects.filter((project) => project.id !== projectId));
      
      toast({
        title: "Succès",
        description: "Projet supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet",
        variant: "destructive",
      });
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    completed: 'bg-blue-500',
    on_hold: 'bg-yellow-500',
    cancelled: 'bg-red-500',
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Actif',
      completed: 'Terminé',
      on_hold: 'En pause',
      cancelled: 'Annulé',
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestion des projets</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'list' ? 'board' : 'list')}>
            {viewMode === 'list' ? 'Vue Kanban' : 'Vue Liste'}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedProject(null);
                form.reset({
                  name: "",
                  description: "",
                  status: "active",
                  start_date: "",
                  end_date: "",
                  budget: "",
                  client_id: "",
                });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Projet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{selectedProject ? 'Modifier le projet' : 'Créer un projet'}</DialogTitle>
                <DialogDescription>
                  {selectedProject 
                    ? 'Modifiez les détails du projet ci-dessous.'
                    : 'Ajoutez un nouveau projet à votre tableau de bord.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du projet</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom du projet" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Description du projet" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de début</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de fin</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un statut" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Actif</SelectItem>
                              <SelectItem value="completed">Terminé</SelectItem>
                              <SelectItem value="on_hold">En pause</SelectItem>
                              <SelectItem value="cancelled">Annulé</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="client_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit">{selectedProject ? 'Mettre à jour' : 'Créer'}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 text-center py-10">
              <p className="text-muted-foreground">Aucun projet trouvé. Créez votre premier projet!</p>
            </div>
          ) : (
            projects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {project.clients?.name || 'Aucun client'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditProject(project)}>
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-600"
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className={`h-2 w-2 rounded-full ${statusColors[project.status] || 'bg-gray-500'}`} />
                    <span className="text-sm">{getStatusLabel(project.status)}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description || 'Aucune description'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {project.start_date && (
                      <div className="flex items-center text-xs">
                        <CalendarIcon className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                        <span>Début: {new Date(project.start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {project.end_date && (
                      <div className="flex items-center text-xs">
                        <Clock className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                        <span>Fin: {new Date(project.end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-3 pb-3 bg-muted/50">
                  <div className="flex justify-between w-full">
                    {project.budget && (
                      <div className="text-sm font-medium">
                        Budget: {parseFloat(project.budget).toLocaleString()} €
                      </div>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setSelectedProject(project)}>
                      Voir les tâches
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      ) : (
        <ProjectBoard projects={projects} />
      )}
    </div>
  );
};

export default Projects;
