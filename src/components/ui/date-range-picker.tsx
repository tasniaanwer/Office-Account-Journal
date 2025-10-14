"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface DateRangePickerProps {
  dateRange: {
    from: string;
    to: string;
  };
  onDateRangeChange: (dateRange: { from: string; to: string }) => void;
  onApply: () => void;
}

export default function DateRangePicker({
  dateRange,
  onDateRangeChange,
  onApply
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    onDateRangeChange({
      ...dateRange,
      [field]: value,
    });
  };

  const handleApply = () => {
    onApply();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {format(new Date(dateRange.from), 'MMM dd, yyyy')} - {format(new Date(dateRange.to), 'MMM dd, yyyy')}
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-2 w-80 z-50">
          <CardHeader>
            <CardTitle>Select Date Range</CardTitle>
            <CardDescription>
              Choose the period for your financial report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={dateRange.from}
                onChange={(e) => handleDateChange('from', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={dateRange.to}
                onChange={(e) => handleDateChange('to', e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleApply} className="flex-1">
                Apply
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}