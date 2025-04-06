import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useToast } from '@/components/ui/use-toast';
import { formatISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { ReportDownloadStatus } from './ReportDownloadStatus';

/**
 * Component for exporting telehealth analytics reports
 */
export const ReportExportOptions = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'excel' | 'csv'>('excel');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [showDownloadStatus, setShowDownloadStatus] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<'excel' | 'csv'>('excel');
  const { toast } = useToast();

  /**
   * Handle report export request
   */
  const handleExport = async () => {
    try {
      setLoading(true);
      
      // Make sure we have valid dates
      if (!dateRange.from || !dateRange.to) {
        toast({
          title: "Invalid Date Range",
          description: "Please select a valid start and end date.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Create query params
      const params = new URLSearchParams({
        startDate: formatISO(dateRange.from, { representation: 'date' }),
        endDate: formatISO(dateRange.to, { representation: 'date' }),
      });
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/telehealth/reports/${format}?${params}`;
      link.setAttribute('download', `telehealth-report-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show download status indicator
      setCurrentFormat(format);
      setShowDownloadStatus(true);
      
      // Toast notification for better feedback
      toast({
        title: "Report Export Started",
        description: `Your ${format.toUpperCase()} report is being generated and will download shortly.`,
        variant: "default",
      });
      
      // Close dialog
      setOpen(false);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Export Reports</CardTitle>
          <CardDescription>
            Download session analytics reports in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Export Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Export Analytics Report</DialogTitle>
                <DialogDescription>
                  Select the format and date range for your telehealth analytics report.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Report Format</h4>
                  <Select value={format} onValueChange={(value: 'excel' | 'csv') => setFormat(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Date Range</h4>
                  <DateRangePicker 
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleExport} disabled={loading}>
                  {loading ? 'Exporting...' : 'Export Report'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Report download status indicator */}
      <ReportDownloadStatus 
        format={currentFormat}
        visible={showDownloadStatus}
        onDismiss={() => setShowDownloadStatus(false)}
      />
    </>
  );
};
