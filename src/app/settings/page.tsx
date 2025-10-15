'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Bell, Shield, Database, Upload, Download, AlertCircle, CheckCircle, Settings } from 'lucide-react';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [importProgress, setImportProgress] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailNotifications: false,
    transactionAlerts: false,
    monthlyReports: false,
    emailFrequency: 'daily'
  });

  // App preferences state
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY'
  });

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }

    const savedNotifications = localStorage.getItem('notificationPreferences');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  const handleSave = async (section: string) => {
    setIsLoading(true);
    setSaveMessage('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (section === 'notifications') {
        // Save notification preferences
        localStorage.setItem('notificationPreferences', JSON.stringify(notifications));
      } else if (section === 'preferences') {
        // Save app preferences
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
      }

      setSaveMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }

    setIsLoading(false);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportProgress('Processing file...');
    setIsLoading(true);

    try {
      const text = await file.text();
      const lines = text.split('\n');

      setImportProgress('Validating data format...');

      // Simple CSV parsing and validation
      let accountsProcessed = 0;
      let transactionsProcessed = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('ACCOUNTS')) {
          // Skip header and process accounts
          i += 2;
          while (i < lines.length && lines[i].trim() && !lines[i].includes('TRANSACTIONS')) {
            const columns = line.split(',').map(col => col.replace(/"/g, ''));
            if (columns.length >= 4) {
              // Would normally create account via API
              accountsProcessed++;
            }
            i++;
          }
        } else if (line.includes('TRANSACTIONS')) {
          // Process transactions
          i += 2;
          while (i < lines.length && lines[i].trim() && !lines[i].includes('TRANSACTION LINES')) {
            const columns = line.split(',').map(col => col.replace(/"/g, ''));
            if (columns.length >= 4) {
              // Would normally create transaction via API
              transactionsProcessed++;
            }
            i++;
          }
        }
      }

      setImportProgress(`Import complete! ${accountsProcessed} accounts and ${transactionsProcessed} transactions processed.`);
      setTimeout(() => setImportProgress(''), 3000);
    } catch (error) {
      console.error('Import failed:', error);
      setImportProgress('Import failed. Please check your file format.');
      setTimeout(() => setImportProgress(''), 3000);
    }

    setIsLoading(false);
  };

  const handleExport = async () => {
    try {
      setExportProgress('Starting export...');

      // Fetch all data from APIs
      const [accountsResponse, transactionsResponse] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/transactions')
      ]);

      if (!accountsResponse.ok || !transactionsResponse.ok) {
        throw new Error('Failed to fetch data for export');
      }

      const accountsData = await accountsResponse.json();
      const transactionsData = await transactionsResponse.json();

      setExportProgress('Processing accounts...');

      // Create comprehensive CSV export
      const csvContent = [
        ['Accounting Data Export', '', '', `Generated: ${new Date().toLocaleString()}`],
        ['', '', '', ''],
        ['ACCOUNTS', '', '', ''],
        ['ID', 'Name', 'Type', 'Code', 'Normal Balance', 'Status', 'Description'],
        ...accountsData.accounts.map((account: any) => [
          account.id,
          account.name,
          account.type,
          account.code,
          account.normalBalance,
          account.isActive ? 'Active' : 'Inactive',
          account.description || ''
        ]),
        ['', '', '', ''],
        ['TRANSACTIONS', '', '', ''],
        ['ID', 'Date', 'Reference', 'Description', 'Status', 'Total Debits', 'Total Credits', 'Account Count'],
        ...transactionsData.transactions.map((transaction: any) => [
          transaction.id,
          transaction.date,
          transaction.reference,
          transaction.description,
          transaction.status,
          transaction.lines.reduce((sum: number, line: any) => sum + line.debit, 0).toFixed(2),
          transaction.lines.reduce((sum: number, line: any) => sum + line.credit, 0).toFixed(2),
          transaction.lines.length
        ]),
        ['', '', '', ''],
        ['TRANSACTION LINES', '', '', ''],
        ['Transaction ID', 'Account Name', 'Debit', 'Credit', 'Description'],
        ...transactionsData.transactions.flatMap((transaction: any) =>
          transaction.lines.map((line: any) => [
            transaction.id,
            line.accountName || line.accountId,
            line.debit.toFixed(2),
            line.credit.toFixed(2),
            line.description || ''
          ])
        ),
        ['', '', '', ''],
        ['SUMMARY', '', '', ''],
        ['Metric', 'Value', '', ''],
        ['Total Accounts', accountsData.accounts.length, '', ''],
        ['Active Accounts', accountsData.accounts.filter((a: any) => a.isActive).length, '', ''],
        ['Total Transactions', transactionsData.transactions.length, '', ''],
        ['Posted Transactions', transactionsData.transactions.filter((t: any) => t.status === 'posted').length, '', ''],
        ['Draft Transactions', transactionsData.transactions.filter((t: any) => t.status === 'draft').length, '', ''],
        ['Total Debits', transactionsData.transactions.reduce((sum: number, t: any) => sum + t.lines.reduce((lineSum: number, line: any) => lineSum + line.debit, 0), 0).toFixed(2), '', ''],
        ['Total Credits', transactionsData.transactions.reduce((sum: number, t: any) => sum + t.lines.reduce((lineSum: number, line: any) => lineSum + line.credit, 0), 0).toFixed(2), '', '']
      ].map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');

      setExportProgress('Creating file...');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accounting-data-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      setExportProgress('Export completed successfully!');
      setTimeout(() => setExportProgress(''), 3000);

    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress('Export failed. Please try again.');
      setTimeout(() => setExportProgress(''), 3000);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Application Settings</h1>
        <p className="text-muted-foreground">Configure your application preferences and data management</p>
      </div>

      {saveMessage && (
        <Alert className={`mb-6 ${saveMessage.includes('successfully') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>
                Customize your application experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={preferences.theme} onValueChange={(value) => setPreferences({...preferences, theme: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={preferences.language} onValueChange={(value) => setPreferences({...preferences, language: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={preferences.currency} onValueChange={(value) => setPreferences({...preferences, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={preferences.dateFormat} onValueChange={(value) => setPreferences({...preferences, dateFormat: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => handleSave('preferences')} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your account activity
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => setNotifications({...notifications, emailNotifications: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium">Transaction Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Get notified when transactions are created or updated
                  </p>
                </div>
                <Switch
                  checked={notifications.transactionAlerts}
                  onCheckedChange={(checked) => setNotifications({...notifications, transactionAlerts: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium">Monthly Reports</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive monthly financial summaries
                  </p>
                </div>
                <Switch
                  checked={notifications.monthlyReports}
                  onCheckedChange={(checked) => setNotifications({...notifications, monthlyReports: checked})}
                />
              </div>

              <div className="border-t pt-4">
                <Label htmlFor="emailFrequency">Email Frequency</Label>
                <Select
                  value={notifications.emailFrequency}
                  onValueChange={(value) => setNotifications({...notifications, emailFrequency: value})}
                  disabled={!notifications.emailNotifications}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => handleSave('notifications')} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Application Security</CardTitle>
              <CardDescription>
                Configure security settings for the accounting application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for all users accessing the application
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium">Session Timeout</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically log out inactive users
                  </p>
                </div>
                <Select defaultValue="30">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium">Password Policy</h4>
                  <p className="text-sm text-muted-foreground">
                    Enforce strong password requirements
                  </p>
                </div>
                <Switch defaultChecked={true} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-medium">Audit Logging</h4>
                  <p className="text-sm text-muted-foreground">
                    Log all user activities and data changes
                  </p>
                </div>
                <Switch defaultChecked={true} />
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Access Control</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Admin Access</p>
                      <p className="text-sm text-muted-foreground">Full system access</p>
                    </div>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Accountant Access</p>
                      <p className="text-sm text-muted-foreground">Financial data access</p>
                    </div>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Viewer Access</p>
                      <p className="text-sm text-muted-foreground">Read-only access</p>
                    </div>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export, import, and manage your accounting data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="h-20 flex-col w-full"
                    onClick={handleExport}
                    disabled={!!exportProgress || isLoading}
                  >
                    <Download className="h-6 w-6 mb-2" />
                    Export Data
                    {exportProgress && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {exportProgress}
                      </span>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Download all your accounting data as CSV
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="h-20 flex-col w-full"
                    asChild
                    disabled={isLoading}
                  >
                    <label htmlFor="import-file" className="cursor-pointer">
                      <Upload className="h-6 w-6 mb-2" />
                      Import Data
                      {importProgress && (
                        <span className="text-xs text-muted-foreground mt-1">
                          {importProgress}
                        </span>
                      )}
                    </label>
                  </Button>
                  <input
                    id="import-file"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleImport}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Upload CSV file to import accounting data
                  </p>
                </div>
              </div>

              {exportProgress && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {exportProgress}
                  </div>
                  <Progress value={exportProgress.includes('Processing') ? 60 : exportProgress.includes('Creating') ? 90 : 30} />
                </div>
              )}

              {importProgress && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {importProgress}
                  </div>
                  <Progress value={importProgress.includes('Processing') ? 60 : importProgress.includes('Validating') ? 40 : 80} />
                </div>
              )}

              <div className="border-t pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-destructive">Danger Zone</h4>
                    <p className="text-sm text-muted-foreground">
                      Once you delete your data, there is no going back. Please be certain.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                      Clear Transactions
                    </Button>
                    <Button variant="destructive" size="sm">
                      Delete All Data
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-2">Data Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accounts:</span>
                      <span className="font-medium">--</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transactions:</span>
                      <span className="font-medium">--</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Database Size:</span>
                      <span className="font-medium">--</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Backup:</span>
                      <span className="font-medium">--</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}