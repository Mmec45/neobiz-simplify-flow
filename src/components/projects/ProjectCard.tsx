
import React from 'react';
import { MoreVertical, Clock, CalendarIcon, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectCardProps {
  project: any;
  onEdit: (project: any) => void;
  onDelete: (projectId: string) => void;
  onSelect: (project: any) => void;
}

const ProjectCard = ({ project, onEdit, onDelete, onSelect }: ProjectCardProps) => {
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

  return (
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
              <DropdownMenuItem onClick={() => onEdit(project)}>
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(project.id)}
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

        {project.total_time_spent !== undefined && (
          <div className="flex items-center mt-3 text-xs">
            <Timer className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
            <span>Temps total: {project.total_time_spent} heures</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-3 pb-3 bg-muted/50">
        <div className="flex justify-between w-full">
          {project.budget && (
            <div className="text-sm font-medium">
              Budget: {parseFloat(project.budget).toLocaleString()} €
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => onSelect(project)}>
            Voir les tâches
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
