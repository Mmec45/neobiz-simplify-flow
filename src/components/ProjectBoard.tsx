
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Clock, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

interface ProjectBoardProps {
  projects: any[];
}

const taskFormSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  status: z.string().default("todo"),
  priority: z.string().default("medium"),
  due_date: z.string().optional(),
  project_id: z.string().min(1, "Le projet est requis"),
  time_estimate: z.string().optional(),
});

const ProjectBoard = ({ projects }: ProjectBoardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  
  const taskForm = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      due_date: "",
      project_id: "",
      time_estimate: "",
    },
  });

  // Fetch tasks when project changes
  useEffect(() => {
    if (!selectedProject) {
      if (projects.length > 0) {
        setSelectedProject(projects[0].id);
      } else {
        setTasks([]);
        setLoading(false);
        return;
      }
    }
    
    const fetchTasks = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('project_tasks')
          .select('*')
          .eq('project_id', selectedProject)
          .order('column_order', { ascending: true });
          
        if (error) throw error;
        
        setTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les tâches",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (selectedProject) {
      fetchTasks();
    }
  }, [selectedProject, toast, projects]);

  const onTaskSubmit = async (values: z.infer<typeof taskFormSchema>) => {
    try {
      const taskData = {
        ...values,
        user_id: user?.id,
        project_id: selectedProject,
        time_estimate: values.time_estimate ? parseInt(values.time_estimate) : null,
      };
      
      const { error } = await supabase
        .from('project_tasks')
        .insert(taskData);
        
      if (error) throw error;
      
      // Refresh tasks
      const { data } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', selectedProject)
        .order('column_order', { ascending: true });
        
      setTasks(data || []);
      setOpenTaskDialog(false);
      taskForm.reset();
      
      toast({
        title: "Succès",
        description: "Tâche créée avec succès",
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', taskId);
        
      if (error) throw error;
      
      // Remove task from state
      setTasks(tasks.filter(task => task.id !== taskId));
      
      toast({
        title: "Succès",
        description: "Tâche supprimée avec succès",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive",
      });
    }
  };

  // Update task status when dragged to a different column
  const handleDragOver = (e: React.DragOverEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
        
      if (error) throw error;
      
      // Update task in state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      
      toast({
        title: "Succès",
        description: "Statut de la tâche mis à jour",
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const priorityColors: Record<string, string> = {
    low: "bg-blue-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    urgent: "bg-red-500"
  };
  
  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: "Faible",
      medium: "Moyenne",
      high: "Haute",
      urgent: "Urgente"
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  if (loading && !selectedProject) {
    return <div className="flex justify-center items-center h-full">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Sélectionner un projet" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Dialog open={openTaskDialog} onOpenChange={setOpenTaskDialog}>
          <DialogTrigger asChild>
            <Button disabled={!selectedProject}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ajouter une tâche</DialogTitle>
              <DialogDescription>
                Créer une nouvelle tâche pour le projet sélectionné.
              </DialogDescription>
            </DialogHeader>
            <Form {...taskForm}>
              <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4">
                <FormField
                  control={taskForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input placeholder="Titre de la tâche" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={taskForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Description de la tâche" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={taskForm.control}
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
                            <SelectItem value="todo">À faire</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="review">En révision</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={taskForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorité</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une priorité" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Faible</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Haute</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={taskForm.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'échéance</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={taskForm.control}
                    name="time_estimate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temps estimé (heures)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit">Créer</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {!selectedProject ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Sélectionnez un projet pour voir les tâches</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['todo', 'in_progress', 'review', 'completed'].map((columnStatus) => {
            const columnTasks = tasks.filter(task => task.status === columnStatus);
            const columnTitle = {
              todo: 'À faire',
              in_progress: 'En cours',
              review: 'En révision',
              completed: 'Terminé'
            }[columnStatus];
            
            return (
              <div
                key={columnStatus}
                className="bg-muted/50 p-3 rounded-md"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, columnStatus)}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">{columnTitle}</h3>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {columnTasks.map(task => (
                    <Card
                      key={task.id}
                      className="cursor-move"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <div className={`px-2 py-0.5 rounded text-white text-xs ${priorityColors[task.priority]}`}>
                            {getPriorityLabel(task.priority)}
                          </div>
                          
                          {task.due_date && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {columnTasks.length === 0 && (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      Aucune tâche
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectBoard;
