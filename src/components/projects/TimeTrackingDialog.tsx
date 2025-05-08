
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Timer, Play, Square } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TimeTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onSaveTime: (taskId: string, timeSpent: number) => Promise<void>;
}

const TimeTrackingDialog = ({ open, onOpenChange, task, onSaveTime }: TimeTrackingDialogProps) => {
  const [timeSpent, setTimeSpent] = useState<number>(task?.time_spent || 0);
  const [timeToAdd, setTimeToAdd] = useState<number>(0);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const handleStartTracking = () => {
    setIsTracking(true);
    setStartTime(new Date());
  };
  
  const handleStopTracking = () => {
    if (startTime) {
      const endTime = new Date();
      const diffMs = endTime.getTime() - startTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60); // Convert to hours
      // Round to 2 decimal places
      const roundedHours = Math.round(diffHours * 100) / 100;
      
      setTimeToAdd(prevTime => prevTime + roundedHours);
    }
    setIsTracking(false);
    setStartTime(null);
  };
  
  const handleSaveTime = async () => {
    const newTimeSpent = timeSpent + timeToAdd;
    await onSaveTime(task.id, newTimeSpent);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Suivi du temps</DialogTitle>
          <DialogDescription>
            Enregistrez le temps passé sur cette tâche: {task?.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Timer className="h-5 w-5 text-muted-foreground" />
            <div>Temps déjà enregistré: {timeSpent} heures</div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="time-to-add" className="text-sm font-medium">
              Ajouter du temps (heures)
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="time-to-add"
                type="number"
                step="0.01"
                value={timeToAdd}
                onChange={(e) => setTimeToAdd(parseFloat(e.target.value) || 0)}
                disabled={isTracking}
              />
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            {!isTracking ? (
              <Button 
                onClick={handleStartTracking} 
                className="flex items-center"
              >
                <Play className="h-4 w-4 mr-2" />
                Démarrer le chrono
              </Button>
            ) : (
              <Button 
                onClick={handleStopTracking} 
                variant="destructive"
                className="flex items-center"
              >
                <Square className="h-4 w-4 mr-2" />
                Arrêter le chrono
              </Button>
            )}
          </div>
          
          {isTracking && startTime && (
            <div className="text-center text-sm font-medium text-muted-foreground">
              Chronomètre actif depuis{" "}
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSaveTime}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimeTrackingDialog;
