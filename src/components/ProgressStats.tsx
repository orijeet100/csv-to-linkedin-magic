import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, Users, Clock, CheckCircle } from 'lucide-react';
import { UploadedFile } from './FileUpload';

interface ProgressStatsProps {
  uploadedFiles: UploadedFile[];
  totalProcessed: number;
  onTotalProcessedChange: (count: number) => void;
}

export const ProgressStats: React.FC<ProgressStatsProps> = ({ 
  uploadedFiles, 
  totalProcessed, 
  onTotalProcessedChange 
}) => {
  const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
  const totalRecords = completedFiles.reduce((sum, file) => sum + (file.records || 0), 0);
  const remaining = Math.max(0, totalRecords - totalProcessed);
  const progressPercentage = totalRecords > 0 ? (totalProcessed / totalRecords) * 100 : 0;

  const stats = [
    {
      icon: FileText,
      label: 'Files Uploaded',
      value: completedFiles.length,
      color: 'text-primary'
    },
    {
      icon: Users,
      label: 'Total Contacts',
      value: totalRecords.toLocaleString(),
      color: 'text-info'
    },
    {
      icon: CheckCircle,
      label: 'Processed',
      value: totalProcessed.toLocaleString(),
      color: 'text-success'
    },
    {
      icon: Clock,
      label: 'Remaining',
      value: remaining.toLocaleString(),
      color: 'text-warning'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 bg-gradient-card">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-muted/50`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {totalRecords > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Progress Overview</h3>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            
            <Progress value={progressPercentage} className="h-3" />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{totalProcessed.toLocaleString()} processed</span>
              <span>{remaining.toLocaleString()} remaining</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};