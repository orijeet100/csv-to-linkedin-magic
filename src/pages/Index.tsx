import React, { useState } from 'react';
import { FileUpload, UploadedFile } from '@/components/FileUpload';

export const Index: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CSV Profile Extractor
          </h1>
          <p className="text-lg text-gray-600">
            Upload CSV files, extract LinkedIn profiles, and export to Google Sheets automatically
          </p>
        </div>

        <div className="space-y-6">
          <FileUpload
            uploadedFiles={uploadedFiles}
            onFilesChange={setUploadedFiles}
          />
        </div>
      </div>
    </div>
  );
};
