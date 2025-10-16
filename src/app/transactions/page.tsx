"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpDown
} from 'lucide-react';
import type { Account } from '@/db/schema';

interface Transaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  status: 'draft' | 'posted' | 'approved';
  lines: TransactionLine[];
  totalDebit: number;
  totalCredit: number;
}

interface TransactionLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

export default function TransactionsPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'draft',
    lines: [
      { accountId: '', description: '', debit: 0, credit: 0 },
      { accountId: '', description: '', debit: 0, credit: 0 },
    ],
  });

  // Fetch transactions and accounts
  useEffect(() => {
    if (!session) return;

    fetchTransactions();
    fetchAccounts();
  }, [session]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.filter((acc: Account) => acc.isActive));
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  // Transaction form handlers
  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { accountId: '', description: '', debit: 0, credit: 0 }],
    });
  };

  const handleRemoveLine = (index: number) => {
    if (formData.lines.length > 2) {
      const newLines = formData.lines.filter((_, i) => i !== index);
      setFormData({ ...formData, lines: newLines });
    }
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // Auto-balance: if debit is entered, clear credit and vice versa
    if (field === 'debit' && value > 0) {
      newLines[index].credit = 0;
    } else if (field === 'credit' && value > 0) {
      newLines[index].debit = 0;
    }

    setFormData({ ...formData, lines: newLines });
  };

  const calculateTotals = () => {
    const totalDebit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    return { totalDebit, totalCredit };
  };

  const validateTransaction = () => {
    if (!formData.date || !formData.description) {
      setError('Date and description are required');
      return false;
    }

    if (formData.lines.length < 2) {
      setError('At least 2 line items are required');
      return false;
    }

    for (const line of formData.lines) {
      if (!line.accountId || (!line.debit && !line.credit)) {
        setError('Each line must have an account and either debit or credit amount');
        return false;
      }
    }

    const { totalDebit, totalCredit } = calculateTotals();
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      setError('Transaction must balance: Total debits must equal total credits');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateTransaction()) {
      return;
    }

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTransactions();
        setShowCreateForm(false);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          description: '',
          status: 'draft',
          lines: [
            { accountId: '', description: '', debit: 0, credit: 0 },
            { accountId: '', description: '', debit: 0, credit: 0 },
          ],
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create transaction');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleStatusUpdate = async (transactionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchTransactions();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update transaction');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTransactions();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete transaction');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'posted': return <CheckCircle className="h-4 w-4" />;
      case 'approved': return <Eye className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'posted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            Manage your double-entry transactions
          </p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Transaction</DialogTitle>
              <DialogDescription>
                Enter a double-entry transaction with balanced debits and credits.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="posted">Posted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Transaction description"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Transaction Lines</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Line
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.lines.map((line, index) => (
                    <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                      <Select value={line.accountId} onValueChange={(value) => handleLineChange(index, 'accountId', value)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Description"
                        value={line.description}
                        onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Debit"
                        value={line.debit || ''}
                        onChange={(e) => handleLineChange(index, 'debit', parseFloat(e.target.value) || 0)}
                        className="w-24"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Credit"
                        value={line.credit || ''}
                        onChange={(e) => handleLineChange(index, 'credit', parseFloat(e.target.value) || 0)}
                        className="w-24"
                      />
                      {formData.lines.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLine(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Totals</p>
                    <p className="text-lg font-semibold">
                      Debit: ${totalDebit.toFixed(2)} | Credit: ${totalCredit.toFixed(2)}
                    </p>
                  </div>
                  <div className={`text-right ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    <p className="text-sm font-medium">
                      {isBalanced ? 'Balanced ✓' : 'Not Balanced ✗'}
                    </p>
                    <p className="text-xs">
                      Difference: ${Math.abs(totalDebit - totalCredit).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!isBalanced}>
                  Create Transaction
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          <CardDescription>
            Your complete transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found. Create your first transaction to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{transaction.date}</span>
                      <span className="text-sm text-muted-foreground">{transaction.reference}</span>
                      <Badge className={getStatusColor(transaction.status)}>
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1">{transaction.status}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      {transaction.status === 'draft' && session?.user?.role !== 'viewer' && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleStatusUpdate(transaction.id, 'posted')}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(transaction.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {transaction.status === 'posted' && ['admin', 'accountant'].includes(session?.user?.role || '') && (
                        <Button variant="ghost" size="sm" onClick={() => handleStatusUpdate(transaction.id, 'approved')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium mb-2">{transaction.description}</p>
                  <div className="space-y-1">
                    {transaction.lines.map((line, index) => (
                      <div key={line.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground">{line.accountCode}</span>
                          <span>{line.accountName}</span>
                          {line.description && (
                            <span className="text-muted-foreground">- {line.description}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          {line.debit > 0 && (
                            <span className="text-red-600 font-medium">
                              <TrendingDown className="inline h-3 w-3 mr-1" />
                              ${line.debit.toFixed(2)}
                            </span>
                          )}
                          {line.credit > 0 && (
                            <span className="text-green-600 font-medium">
                              <TrendingUp className="inline h-3 w-3 mr-1" />
                              ${line.credit.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t flex justify-between text-sm">
                    <span>Totals:</span>
                    <div className="space-x-4">
                      <span className="text-red-600">Debit: ${transaction.totalDebit.toFixed(2)}</span>
                      <span className="text-green-600">Credit: ${transaction.totalCredit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}