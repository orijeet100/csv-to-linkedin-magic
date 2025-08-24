import React, { useState } from 'react';
import { FileUpload, UploadedFile } from '@/components/FileUpload';
import { ProgressStats } from '@/components/ProgressStats';
import { LinkedInSender } from '@/components/LinkedInSender';

const Index = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [totalProcessed, setTotalProcessed] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LinkedIn Outreach Manager
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload your CSV files and start sending personalized LinkedIn connection requests with ease.
            </p>
          </div>

          {/* Progress Stats */}
          <ProgressStats 
            uploadedFiles={uploadedFiles}
            totalProcessed={totalProcessed}
            onTotalProcessedChange={setTotalProcessed}
          />

          {/* File Upload */}
          <FileUpload 
            onFilesChange={setUploadedFiles}
            uploadedFiles={uploadedFiles}
          />

          {/* LinkedIn Sender */}
          <LinkedInSender
            uploadedFiles={uploadedFiles}
            isRunning={isRunning}
            onToggleRunning={setIsRunning}
            totalProcessed={totalProcessed}
            onProcessedChange={setTotalProcessed}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
