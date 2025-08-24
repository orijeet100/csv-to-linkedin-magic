import React, { useCallback, useState } from 'react';
import { Upload, File, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  records?: number;
}

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  uploadedFiles: UploadedFile[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, uploadedFiles }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'text/csv' || file.name.endsWith('.csv')
    );
    
    processFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    e.target.value = '';
  }, []);

  const processFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0
    }));

    onFilesChange([...uploadedFiles, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach(uploadedFile => {
      simulateUpload(uploadedFile);
    });
  };

  const simulateUpload = (uploadedFile: UploadedFile) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Simulate CSV parsing to get record count
        const randomRecords = Math.floor(Math.random() * 1000) + 50;
        
        const updatedFiles = uploadedFiles.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: 'completed' as const, progress: 100, records: randomRecords }
            : f
        );
        onFilesChange(updatedFiles);
      } else {
        const updatedFiles = uploadedFiles.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, progress }
            : f
        );
        onFilesChange(updatedFiles);
      }
    }, 200);
  };

  const removeFile = (fileId: string) => {
    onFilesChange(uploadedFiles.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card 
        className={cn(
          "border-2 border-dashed transition-all duration-300 cursor-pointer",
          "hover:border-primary/50 hover:bg-gradient-card",
          isDragOver && "border-primary bg-primary/5 shadow-elegant"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-12 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload CSV Files</h3>
          <p className="text-muted-foreground mb-6">
            Drag and drop your CSV files here, or click to browse
          </p>
          <input
            type="file"
            multiple
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <Button 
            variant="gradient" 
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Choose Files
          </Button>
        </div>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
          <div className="space-y-4">
            {uploadedFiles.map(file => (
              <div key={file.id} className="flex items-center space-x-4 p-4 rounded-lg bg-muted/50">
                <File className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                        {file.records && ` • ${file.records} records`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-2" />
                  )}
                  
                  {file.status === 'completed' && (
                    <div className="flex items-center text-success text-sm">
                      <Check className="h-4 w-4 mr-1" />
                      Upload complete
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};