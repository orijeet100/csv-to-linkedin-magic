import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, File, X, Check, Users, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { GoogleSheetsService } from '@/lib/googleSheets';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
}

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  uploadedFiles: UploadedFile[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, uploadedFiles }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localFiles, setLocalFiles] = useState<UploadedFile[]>([]);
  const [globalUniqueUrls, setGlobalUniqueUrls] = useState<string[]>([]);
  const [globalUniqueCount, setGlobalUniqueCount] = useState(0);
  const [globalProfiles, setGlobalProfiles] = useState<Array<{name: string, url: string}>>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const filesRef = useRef<UploadedFile[]>([]);
  const { toast } = useToast();
  const googleSheetsService = GoogleSheetsService.getInstance();

  // Check authentication status and handle OAuth callback
  useEffect(() => {
    // Check if we're returning from OAuth (authorization code in URL)
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    
    if (authCode) {
      // Handle OAuth callback
      const handleOAuthCallback = async () => {
        try {
          setIsExporting(true);
          
          // Authenticate with Google
          await googleSheetsService.handleAuthCallback(authCode);
          setIsAuthenticated(true);
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          toast({
            title: "Authentication successful!",
            description: "Now exporting to Google Sheets...",
            variant: "default"
          });
          
          // Restore previous state from localStorage
          const savedState = localStorage.getItem('csv_app_state');
          if (savedState) {
            try {
              const parsedState = JSON.parse(savedState);
              const stateAge = Date.now() - parsedState.timestamp;
              
              // Only restore state if it's less than 1 hour old
              if (stateAge < 60 * 60 * 1000) {
                setLocalFiles(parsedState.uploadedFiles);
                setGlobalProfiles(parsedState.globalProfiles);
                setGlobalUniqueCount(parsedState.globalUniqueCount);
                
                toast({
                  title: "State restored",
                  description: `Restored ${parsedState.uploadedFiles.length} files and ${parsedState.globalUniqueCount} profiles.`,
                  variant: "default"
                });
              } else {
                localStorage.removeItem('csv_app_state');
              }
            } catch (error) {
              localStorage.removeItem('csv_app_state');
            }
          }
          
          // Automatically export to Google Sheets
          await performExport();
          
        } catch (error) {
          toast({
            title: "Authentication failed",
            description: "Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsExporting(false);
        }
      };
      
      handleOAuthCallback();
    } else {
      // Check if already authenticated
      setIsAuthenticated(googleSheetsService.isUserAuthenticated());
    }
  }, []);

  // Keep ref and local state in sync with prop
  useEffect(() => {
    filesRef.current = uploadedFiles;
    setLocalFiles(uploadedFiles);
  }, [uploadedFiles]);

  // Function to parse CSV and find unique LinkedIn URLs and names from linkedin_url columns
  const parseCSVForLinkedInUrls = async (file: File): Promise<{ new: number; urls: string[]; profiles: Array<{name: string, url: string}> }> => {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      if (lines.length < 2) return { new: 0, urls: [], profiles: [] }; // Need at least header + 1 data row
      
      // Get the header row (first line)
      const headerRow = lines[0];
      const headers = headerRow.split(',').map(header => 
        header.trim().toLowerCase().replace(/"/g, '')
      );
      
      // Find the index of linkedin_url column(s) and name column(s)
      const linkedInUrlColumnIndexes = headers
        .map((header, index) => header.includes('linkedin_url') ? index : -1)
        .filter(index => index !== -1);
      
      const nameColumnIndexes = headers
        .map((header, index) => 
          header.includes('name') || header.includes('first_name') || header.includes('full_name') ? index : -1
        )
        .filter(index => index !== -1);
      
      if (linkedInUrlColumnIndexes.length === 0) return { new: 0, urls: [], profiles: [] };
      
      // Extract URLs and names from data rows (skip header)
      const fileUrls = new Set<string>();
      const fileProfiles: Array<{name: string, url: string}> = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue; // Skip empty lines
        
        const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
        
        linkedInUrlColumnIndexes.forEach(columnIndex => {
          if (values[columnIndex] && values[columnIndex] !== '') {
            const url = values[columnIndex];
            // Normalize URL to remove duplicates
            const normalizedUrl = url.toLowerCase().replace(/\/$/, '');
            if (normalizedUrl.includes('linkedin.com')) {
              fileUrls.add(normalizedUrl);
              
              // Try to find corresponding name
              let name = 'Unknown';
              if (nameColumnIndexes.length > 0) {
                const nameIndex = nameColumnIndexes[0]; // Use first name column found
                if (values[nameIndex] && values[nameIndex] !== '') {
                  name = values[nameIndex];
                }
              }
              
              fileProfiles.push({ name, url: normalizedUrl });
            }
          }
        });
      }
      
      // Count how many are new vs total
      let newUrls = 0;
      fileUrls.forEach(url => {
        if (!globalUniqueUrls.includes(url)) {
          newUrls++;
        }
      });
      
      return { new: newUrls, urls: Array.from(fileUrls), profiles: fileProfiles };
    } catch (error) {
      toast({
        title: "Error parsing CSV",
        description: "Failed to process CSV file. Please ensure it's a valid CSV and contains 'linkedin_url' and 'name' columns.",
        variant: "destructive"
      });
      return { new: 0, urls: [], profiles: [] };
    }
  };

  // Export to Google Sheets with OAuth flow
  const exportToGoogleSheets = async () => {
    if (!globalProfiles.length) {
      toast({
        title: "No profiles to export",
        description: "Please upload CSV files first to extract LinkedIn profiles.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsExporting(true);
      
      // Check if already authenticated
      if (googleSheetsService.isUserAuthenticated()) {
        // Already authenticated, export directly
        await performExport();
      } else {
        // Store current state in localStorage before OAuth
        const stateToPersist = {
          uploadedFiles: uploadedFiles,
          globalProfiles: globalProfiles,
          globalUniqueCount: globalUniqueCount,
          timestamp: Date.now()
        };
        localStorage.setItem('csv_app_state', JSON.stringify(stateToPersist));
        
        // Start OAuth flow
        const authUrl = googleSheetsService.getAuthUrl();
        window.location.href = authUrl;
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to start Google Sheets export. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Perform the actual export to Google Sheets
  const performExport = async () => {
    try {
      setIsExporting(true);
      
      // Export profiles to Google Sheets
      await googleSheetsService.writeProfilesToSheet(globalProfiles);
      
      // Clean up saved state after successful export
      localStorage.removeItem('csv_app_state');
      
      toast({
        title: "Export successful!",
        description: `${globalProfiles.length} profiles exported to Google Sheets.`,
        variant: "default"
      });
      
      // Open the Google Sheet
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${googleSheetsService.getSheetId()}/edit`;
      window.open(sheetUrl, '_blank');
      
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export to Google Sheets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Function to export profiles to CSV
  const exportToCSV = async () => {
    if (globalProfiles.length === 0) {
      toast({
        title: "No profiles to export",
        description: "Upload some CSV files first to export profiles.",
        variant: "destructive"
      });
      return;
    }

    const csvContent = [
      ['Name', 'LinkedIn URL'],
      ...globalProfiles.map(profile => [profile.name, profile.url])
    ];

    const blob = new Blob([csvContent.map(row => row.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'linkedin_profiles.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "CSV Export Successful!",
      description: `${globalProfiles.length} profiles exported to linkedin_profiles.csv`,
      variant: "default"
    });
  };

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

    // Update local files first
    setLocalFiles(prevFiles => [...prevFiles, ...newFiles]);
    
    // Notify parent component
    onFilesChange([...uploadedFiles, ...newFiles]);
    
    // Update filesRef for simulateUpload
    filesRef.current = [...uploadedFiles, ...newFiles];
    
    // Start upload simulation for each new file
    newFiles.forEach(file => simulateUpload(file.id));
  };

  const simulateUpload = (uploadedFileId: string) => {
    let progress = 0;
    const interval = setInterval(async () => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Find the uploaded file by ID
        const uploadedFile = filesRef.current.find(f => f.id === uploadedFileId);
        if (!uploadedFile) {
          clearInterval(interval);
          return;
        }

        // Parse CSV and count LinkedIn URL columns when upload completes
        const { new: newLinkedInUrls, urls: fileUrls, profiles: fileProfiles } = await parseCSVForLinkedInUrls(uploadedFile.file);
        
        // Add new URLs to global set
        setGlobalUniqueUrls(prevGlobalUrls => {
          const newGlobalUrls = [...prevGlobalUrls];
          let addedNew = 0;
          fileUrls.forEach(url => {
            if (!newGlobalUrls.includes(url)) {
              newGlobalUrls.push(url);
              addedNew++;
            }
          });
          
          // Update the global count
          setGlobalUniqueCount(prevCount => prevCount + addedNew);
          
          return newGlobalUrls;
        });

        // Add new profiles to global set
        setGlobalProfiles(prevProfiles => {
          const newProfiles = [...prevProfiles];
          let addedNew = 0;
          fileProfiles.forEach(profile => {
            if (!newProfiles.some(p => p.url === profile.url)) {
              newProfiles.push(profile);
              addedNew++;
            }
          });
          return newProfiles;
        });
        
        setLocalFiles(prevFiles => {
          const updatedFiles = prevFiles.map(f => 
          f.id === uploadedFileId 
              ? { ...f, status: 'completed' as const, progress: 100 }
            : f
        );
          
          // Update ref
          filesRef.current = updatedFiles;
          
          // Notify parent
        onFilesChange(updatedFiles);
          
          // Show toast notification
          if (newLinkedInUrls > 0) {
            toast({
              title: "New LinkedIn Profiles Detected!",
              description: `${newLinkedInUrls} new unique LinkedIn profile(s) found in ${uploadedFile.name}`,
              variant: "default"
            });
          } else {
            toast({
              title: "CSV Processed",
              description: `No new unique LinkedIn profiles found in ${uploadedFile.name}`,
              variant: "default"
            });
          }
          
          return updatedFiles;
        });
      } else {
        setLocalFiles(prevFiles => {
          const updatedFiles = prevFiles.map(f => 
          f.id === uploadedFileId 
            ? { ...f, progress }
            : f
        );
          
          // Update ref
          filesRef.current = updatedFiles;
          
          // Notify parent
        onFilesChange(updatedFiles);
          
          return updatedFiles;
        });
      }
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setLocalFiles(prevFiles => {
      const updatedFiles = prevFiles.filter(f => f.id !== fileId);
      onFilesChange(updatedFiles);
      filesRef.current = updatedFiles;
      return updatedFiles;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const completedFiles = localFiles.filter(f => f.status === 'completed');
  const remainingFiles = localFiles.filter(f => f.status === 'uploading');

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
            Drag and drop multiple CSV files here, or click to browse and select multiple files
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
            Choose Multiple Files
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Hold Ctrl/Cmd to select multiple files
          </p>
        </div>
      </Card>

      {localFiles.length > 0 && (
        <Card className="p-6">
          {/* Global Unique URLs Counter - Above Uploaded Files text */}
          {globalUniqueCount > 0 && (
            <div className="mb-6 p-4 bg-gradient-primary text-white rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6" />
                  <div>
                    <h3 className="text-lg font-semibold">Total Unique LinkedIn Profiles</h3>
                    <p className="text-sm opacity-90">Across all uploaded files</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{globalUniqueCount.toLocaleString()}</div>
                  <div className="text-sm opacity-90">unique URLs</div>
                  <div className="text-sm opacity-90">{globalProfiles.length} profiles with names</div>
                </div>
              </div>
              
              {/* Export Buttons */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
                {/* Authentication Status */}
                <div className="flex items-center space-x-2 text-sm">
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Authenticated with Google</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-amber-600">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span>Not authenticated</span>
                    </div>
                  )}
                </div>
                
                {!isAuthenticated && (
                  <p className="text-xs text-amber-600">
                    Click "Export to Google Sheets" to authenticate and export your data
                  </p>
                )}
                
                <Button
                  onClick={exportToGoogleSheets}
                  disabled={isExporting || globalProfiles.length === 0}
                  className="flex items-center space-x-2"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Export to Google Sheets</span>
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={exportToCSV}
                  className="bg-white text-primary hover:bg-gray-100"
                >
                  📥 Export to CSV
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${googleSheetsService.getSheetId()}/edit`, '_blank')}
                  className="bg-white text-primary hover:bg-gray-100"
                >
                  🔗 View Sheet
                </Button>
                
                {isAuthenticated && (
                  <Button
                    onClick={() => {
                      googleSheetsService.logout();
                      setIsAuthenticated(false);
                      toast({
                        title: "Logged out",
                        description: "You can now re-authenticate if needed.",
                        variant: "default"
                      });
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Logout
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Uploaded Files ({localFiles.length})</h3>
            <div className="text-sm text-muted-foreground">
              {completedFiles.length} completed • {remainingFiles.length} remaining
            </div>
          </div>
          
          <div className="space-y-4">
            {localFiles.map((file, index) => (
              <div key={file.id} className="flex items-center space-x-4 p-4 rounded-lg bg-muted/50">
                <div className="flex-shrink-0">
                <File className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • File #{index + 1}
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
                    <div className="space-y-2">
                    <Progress value={file.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Uploading... {Math.round(file.progress)}%
                      </p>
                    </div>
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