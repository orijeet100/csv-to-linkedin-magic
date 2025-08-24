import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Send, Settings, Play, Pause, AlertCircle } from 'lucide-react';
import { UploadedFile } from './FileUpload';
import { useToast } from '@/hooks/use-toast';

interface LinkedInSenderProps {
  uploadedFiles: UploadedFile[];
  isRunning: boolean;
  onToggleRunning: (running: boolean) => void;
  totalProcessed: number;
  onProcessedChange: (count: number) => void;
}

export const LinkedInSender: React.FC<LinkedInSenderProps> = ({
  uploadedFiles,
  isRunning,
  onToggleRunning,
  totalProcessed,
  onProcessedChange
}) => {
  const [message, setMessage] = useState(
    "Hi {firstName}, I'd love to connect with you and explore potential collaboration opportunities. Looking forward to connecting!"
  );
  const [personalizeMessage, setPersonalizeMessage] = useState(true);
  const [delayBetweenRequests, setDelayBetweenRequests] = useState(true);
  const { toast } = useToast();

  const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
  const totalRecords = completedFiles.reduce((sum, file) => sum + (file.records || 0), 0);
  const canStart = completedFiles.length > 0 && !isRunning;

  const handleStart = () => {
    if (totalRecords === 0) {
      toast({
        title: "No contacts found",
        description: "Please upload at least one CSV file with contacts.",
        variant: "destructive"
      });
      return;
    }

    onToggleRunning(true);
    toast({
      title: "LinkedIn requests started",
      description: `Starting to send requests to ${totalRecords - totalProcessed} contacts.`,
    });

    // Simulate processing
    const interval = setInterval(() => {
      if (totalProcessed >= totalRecords) {
        clearInterval(interval);
        onToggleRunning(false);
        toast({
          title: "Campaign completed",
          description: "All LinkedIn requests have been sent successfully!",
        });
        return;
      }

      onProcessedChange(totalProcessed + 1);
    }, delayBetweenRequests ? 2000 : 1000);
  };

  const handleStop = () => {
    onToggleRunning(false);
    toast({
      title: "Campaign paused",
      description: "LinkedIn request sending has been paused.",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">LinkedIn Request Settings</h2>
            <Badge variant={isRunning ? "default" : "secondary"}>
              {isRunning ? "Running" : "Stopped"}
            </Badge>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Connection Request Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your connection request message..."
                className="mt-2 min-h-[100px]"
                disabled={isRunning}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Use {'{firstName}'} to personalize messages with the contact's first name.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Personalize Messages</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically insert first names
                  </p>
                </div>
                <Switch
                  checked={personalizeMessage}
                  onCheckedChange={setPersonalizeMessage}
                  disabled={isRunning}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Delay Between Requests</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add delays to avoid rate limiting
                  </p>
                </div>
                <Switch
                  checked={delayBetweenRequests}
                  onCheckedChange={setDelayBetweenRequests}
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Campaign Control</h3>
            <p className="text-muted-foreground">
              {totalRecords > 0 ? (
                `Ready to process ${totalRecords - totalProcessed} contacts`
              ) : (
                'Upload CSV files to get started'
              )}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {totalRecords === 0 && (
              <div className="flex items-center text-warning text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                No contacts loaded
              </div>
            )}
            
            {isRunning ? (
              <Button
                onClick={handleStop}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Pause className="h-4 w-4" />
                <span>Pause Campaign</span>
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                disabled={!canStart}
                variant="gradient"
                className="flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Send LinkedIn Requests</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};