import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock } from 'lucide-react';

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (scheduledDate: Date) => void;
  loading?: boolean;
  title?: string;
}

const ScheduleDialog = ({ open, onOpenChange, onSchedule, loading = false, title = "Schedule Email" }: ScheduleDialogProps) => {
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const handleSchedule = () => {
    if (!scheduleDate || !scheduleTime) return;
    
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
    const now = new Date();
    
    if (scheduledDateTime <= now) {
      alert('Please select a future date and time.');
      return;
    }
    
    onSchedule(scheduledDateTime);
    setScheduleDate('');
    setScheduleTime('');
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(Math.ceil(now.getMinutes() / 5) * 5).padStart(2, '0'); // Round to next 5 minutes
    return `${hours}:${minutes}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-date">Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="schedule-date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={getTodayDate()}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="schedule-time">Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                min={scheduleDate === getTodayDate() ? getCurrentTime() : undefined}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          {scheduleDate && scheduleTime && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                Email will be scheduled for:
              </p>
              <p className="font-medium">
                {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={loading || !scheduleDate || !scheduleTime}
          >
            {loading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Schedule Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDialog;
