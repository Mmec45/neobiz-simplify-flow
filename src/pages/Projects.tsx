
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import * as z from 'zod';

// Import the new components
import ProjectForm from '@/components/projects/ProjectForm';
import ProjectList from '@/components/projects/ProjectList';
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
      // Fix: Ensure name is not optional
      let projectData = {
        name: values.name, // Required field
        description: values.description,
        status: values.status,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        budget: values.budget ? parseFloat(values.budget) : null,
        client_id: values.client_id || null,
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
              <Button onClick={() => setSelectedProject(null)}>
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
              <ProjectForm 
                selectedProject={selectedProject}
                clients={clients}
                onSubmit={onSubmit}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === 'list' ? (
        <ProjectList
          projects={projects}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onSelectProject={setSelectedProject}
        />
      ) : (
        <ProjectBoard projects={projects} />
      )}
    </div>
  );
};

export default Projects;
