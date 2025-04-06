import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Download, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Props for the ReportDownloadStatus component
 */
interface ReportDownloadStatusProps {
  /** Report format (excel or csv) */
  format: 'excel' | 'csv';
  /** Visibility state of the status component */
  visible: boolean;
  /** Function to call when component should be hidden */
  onDismiss: () => void;
}

/**
 * Component to display the status of a report download
 */
export const ReportDownloadStatus: React.FC<ReportDownloadStatusProps> = ({
  format,
  visible,
  onDismiss,
}) => {
  const [status, setStatus] = useState<'generating' | 'completed' | 'error'>('generating');
  const [progress, setProgress] = useState<number>(0);
  
  // Simulate progress for better UX
  useEffect(() => {
    if (!visible) return;
    
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;
    
    if (status === 'generating') {
      // Simulate progress
      interval = setInterval(() => {
        setProgress((prev) => {
          const increment = Math.random() * 15;
          return Math.min(prev + increment, 95); // Never reach 100% until completed
        });
      }, 800);
      
      // Simulate completion after a reasonable time
      timeout = setTimeout(() => {
        setProgress(100);
        setStatus('completed');
        
        // Auto-dismiss after completion
        setTimeout(() => {
          onDismiss();
        }, 3000);
      }, 3000);
    }
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [visible, status, onDismiss]);
  
  if (!visible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 shadow-lg">
      <Alert
        variant={status === 'error' ? 'destructive' : 'default'}
        className="bg-white border-2 border-primary/20"
      >
        <div className="flex items-start gap-4">
          {status === 'generating' && <Download className="h-5 w-5 text-blue-500 animate-pulse" />}
          {status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {status === 'error' && <AlertCircle className="h-5 w-5" />}
          <div className="flex-1">
            <AlertTitle>
              {status === 'generating' && 'Generating Report'}
              {status === 'completed' && 'Report Ready'}
              {status === 'error' && 'Report Error'}
            </AlertTitle>
            <AlertDescription className="text-sm">
              {status === 'generating' && `Preparing your ${format.toUpperCase()} report...`}
              {status === 'completed' && `Your ${format.toUpperCase()} report has downloaded.`}
              {status === 'error' && 'There was an error generating your report. Please try again.'}
              
              {status === 'generating' && (
                <Progress 
                  value={progress} 
                  className="h-2 mt-2"
                  indicatorClassName="bg-blue-500"
                />
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
};
