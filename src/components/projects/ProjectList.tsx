
import React from 'react';
import ProjectCard from './ProjectCard';

interface ProjectListProps {
  projects: any[];
  onEditProject: (project: any) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectProject: (project: any) => void;
}

const ProjectList = ({ 
  projects, 
  onEditProject, 
  onDeleteProject, 
  onSelectProject 
}: ProjectListProps) => {
  if (projects.length === 0) {
    return (
      <div className="md:col-span-2 lg:col-span-3 text-center py-10">
        <p className="text-muted-foreground">Aucun projet trouvé. Créez votre premier projet!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          onEdit={onEditProject} 
          onDelete={onDeleteProject} 
          onSelect={onSelectProject} 
        />
      ))}
    </div>
  );
};

export default ProjectList;
