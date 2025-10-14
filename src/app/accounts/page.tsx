"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Filter, Edit, Trash2, Eye, EyeOff, FolderTree, DollarSign, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import type { Account } from '@/db/schema';

interface AccountWithChildren extends Account {
  children?: AccountWithChildren[];
}

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('true');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: '',
    parentId: '',
    description: '',
    normalBalance: '',
  });

  // Fetch accounts from API
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
        setFilteredAccounts(data);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = accounts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(account => account.type === filterType);
    }

    // Active filter
    if (filterActive !== 'all') {
      const isActive = filterActive === 'true';
      filtered = filtered.filter(account => account.isActive === isActive);
    }

    setFilteredAccounts(filtered);
  }, [accounts, searchTerm, filterType, filterActive]);

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchAccounts();
        setShowCreateForm(false);
        setFormData({
          code: '',
          name: '',
          type: '',
          parentId: '',
          description: '',
          normalBalance: '',
        });
      }
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    try {
      const response = await fetch(`/api/accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchAccounts();
        setEditingAccount(null);
        setFormData({
          code: '',
          name: '',
          type: '',
          parentId: '',
          description: '',
          normalBalance: '',
        });
      }
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAccounts();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const toggleAccountStatus = async (account: Account) => {
    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !account.isActive }),
      });

      if (response.ok) {
        await fetchAccounts();
      }
    } catch (error) {
      console.error('Error toggling account status:', error);
    }
  };

  const openEditForm = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      type: account.type,
      parentId: account.parentId || '',
      description: account.description || '',
      normalBalance: account.normalBalance,
    });
  };

  // Helper functions
  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return <DollarSign className="h-4 w-4" />;
      case 'liability': return <CreditCard className="h-4 w-4" />;
      case 'equity': return <TrendingUp className="h-4 w-4" />;
      case 'revenue': return <TrendingUp className="h-4 w-4" />;
      case 'expense': return <TrendingDown className="h-4 w-4" />;
      default: return <FolderTree className="h-4 w-4" />;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'bg-blue-100 text-blue-800';
      case 'liability': return 'bg-red-100 text-red-800';
      case 'equity': return 'bg-green-100 text-green-800';
      case 'revenue': return 'bg-emerald-100 text-emerald-800';
      case 'expense': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chart of Accounts</h2>
          <p className="text-muted-foreground">
            Manage your account structure and hierarchy
          </p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
              <DialogDescription>
                Add a new account to your chart of accounts.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Account Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="1000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Account Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asset">Asset</SelectItem>
                      <SelectItem value="liability">Liability</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Cash Account"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Account</Button>
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
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Account Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="asset">Assets</SelectItem>
                <SelectItem value="liability">Liabilities</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts ({filteredAccounts.length})</CardTitle>
          <CardDescription>
            Your complete chart of accounts structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading accounts...</div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No accounts found. Create your first account to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    !account.isActive ? 'opacity-50 bg-muted/50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {getAccountTypeIcon(account.type)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{account.code}</span>
                        <span className="text-muted-foreground">{account.name}</span>
                        <Badge className={getAccountTypeColor(account.type)}>
                          {account.type}
                        </Badge>
                        {!account.isActive && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      {account.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {account.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditForm(account)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAccountStatus(account)}
                    >
                      {account.isActive ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update the account information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-code">Account Code</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="1000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Account Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-name">Account Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Cash Account"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditingAccount(null)}>
                Cancel
              </Button>
              <Button type="submit">Update Account</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}