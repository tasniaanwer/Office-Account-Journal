"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileText,
  Calculator,
  Activity,
  Eye,
  Building,
  Wallet,
  AlertCircle
} from "lucide-react";
import { format, subMonths } from 'date-fns';
import DateRangePicker from '@/components/ui/date-range-picker';

interface ComprehensiveReportData {
  metadata: {
    reportGenerated: string;
    dateRange: { from: string; to: string };
    totalAccounts: number;
    activeAccounts: number;
    inactiveAccounts: number;
    totalTransactions: number;
  };
  balanceSheet: {
    assets: { total: number; accounts: any[]; categories: any };
    liabilities: { total: number; accounts: any[]; categories: any };
    equity: { total: number; accounts: any[] };
    validation: any;
  };
  incomeStatement: {
    revenue: { total: number; accounts: any[] };
    expenses: { total: number; accounts: any[] };
    netIncome: number;
    profitMargin: number;
  };
  cashFlow: { operating: any[]; summary: any };
  trialBalance: { accounts: any[]; validation: any };
  analytics: {
    monthlyTrends: any[];
    topRevenueCategories: any[];
    topExpenseCategories: any[];
    mostActiveAccounts: any[];
    accountTypeDistribution: any;
  };
  kpis: any;
  charts: any;
}

interface BalanceSheetData {
  metadata: any;
  assets: any;
  liabilities: any;
  equity: any;
  summary: any;
  financialRatios: any;
}

interface IncomeStatementData {
  metadata: any;
  revenues: any;
  expenses: any;
  profitability: any;
  performanceMetrics: any;
  monthlyTrend: any[];
}

export default function EnhancedReportsPage() {
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveReportData | null>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null);
  const [incomeStatementData, setIncomeStatementData] = useState<IncomeStatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    from: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      });

      // Fetch all report types
      const [comprehensive, balanceSheet, incomeStatement] = await Promise.all([
        fetch(`/api/reports/comprehensive?${queryParams}`),
        fetch(`/api/reports/balance-sheet?${queryParams}`),
        fetch(`/api/reports/income-statement?${queryParams}`)
      ]);

      if (comprehensive.ok) {
        const data = await comprehensive.json();
        setComprehensiveData(data);
      }

      if (balanceSheet.ok) {
        const data = await balanceSheet.json();
        setBalanceSheetData(data);
      }

      if (incomeStatement.ok) {
        const data = await incomeStatement.json();
        setIncomeStatementData(data);
      }

    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (newDateRange: { from: string; to: string }) => {
    setDateRange(newDateRange);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Chart colors
  const COLORS = {
    primary: '#3b82f6',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#8b5cf6',
    assets: '#3b82f6',
    liabilities: '#ef4444',
    equity: '#10b981',
    revenue: '#10b981',
    expenses: '#ef4444',
    profit: '#3b82f6',
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading comprehensive financial reports...</p>
        </div>
      </div>
    );
  }

  const currentData = comprehensiveData || balanceSheetData || incomeStatementData;
  if (!currentData) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No data available for the selected period.</p>
        </div>
      </div>
    );
  }

  // Extract data from whichever report is available
  const totalRevenue = comprehensiveData?.incomeStatement?.revenue?.total ||
                      incomeStatementData?.revenues?.total || 0;
  const totalExpenses = comprehensiveData?.incomeStatement?.expenses?.total ||
                       incomeStatementData?.expenses?.total || 0;
  const netIncome = comprehensiveData?.incomeStatement?.netIncome ||
                   incomeStatementData?.profitability?.netIncome?.amount || 0;
  const totalAssets = comprehensiveData?.balanceSheet?.assets?.total ||
                    balanceSheetData?.assets?.total || 0;
  const totalLiabilities = comprehensiveData?.balanceSheet?.liabilities?.total ||
                         balanceSheetData?.liabilities?.total || 0;
  const equity = comprehensiveData?.balanceSheet?.equity?.total ||
                balanceSheetData?.equity?.total || 0;

  const monthlyTrends = comprehensiveData?.analytics?.monthlyTrends ||
                       incomeStatementData?.monthlyTrend || [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Comprehensive Financial Reports</h2>
          <p className="text-muted-foreground">
            {format(new Date(dateRange.from), 'MMM dd, yyyy')} - {format(new Date(dateRange.to), 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onApply={fetchAllReports}
          />
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {comprehensiveData?.metadata?.totalTransactions || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Operating costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalRevenue > 0 ? formatPercent((netIncome / totalRevenue) * 100) : '0%'} margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalAssets)}
            </div>
            <p className="text-xs text-muted-foreground">
              Company assets value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Balance Sheet
          </TabsTrigger>
          <TabsTrigger value="income-statement" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Income Statement
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Revenue vs Expenses Trend */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Revenue vs Expenses Trend
                </CardTitle>
                <CardDescription>
                  Monthly comparison of revenue and expenses over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={COLORS.revenue}
                      strokeWidth={2}
                      name="Revenue"
                      dot={{ fill: COLORS.revenue }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke={COLORS.expenses}
                      strokeWidth={2}
                      name="Expenses"
                      dot={{ fill: COLORS.expenses }}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke={COLORS.profit}
                      strokeWidth={2}
                      name="Profit"
                      dot={{ fill: COLORS.profit }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Balance Sheet Overview */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="mr-2 h-5 w-5" />
                  Balance Sheet Overview
                </CardTitle>
                <CardDescription>
                  Assets, Liabilities & Equity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Assets', value: totalAssets, color: COLORS.assets },
                        { name: 'Liabilities', value: totalLiabilities, color: COLORS.liabilities },
                        { name: 'Equity', value: equity, color: COLORS.equity }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Assets', value: totalAssets, color: COLORS.assets },
                        { name: 'Liabilities', value: totalLiabilities, color: COLORS.liabilities },
                        { name: 'Equity', value: equity, color: COLORS.equity }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key profitability indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Gross Profit Margin</span>
                  <Badge variant="default">
                    {totalRevenue > 0 ? formatPercent(((totalRevenue - totalExpenses) / totalRevenue) * 100) : '0%'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Expense Ratio</span>
                  <Badge variant="secondary">
                    {totalRevenue > 0 ? formatPercent((totalExpenses / totalRevenue) * 100) : '0%'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Return on Assets</span>
                  <Badge variant={netIncome > 0 ? "default" : "destructive"}>
                    {totalAssets > 0 ? formatPercent((netIncome / totalAssets) * 100) : '0%'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
                <CardDescription>Account distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Accounts</span>
                  <span className="font-medium">
                    {comprehensiveData?.metadata?.totalAccounts || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Active Accounts</span>
                  <span className="font-medium text-green-600">
                    {comprehensiveData?.metadata?.activeAccounts || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Transactions</span>
                  <span className="font-medium">
                    {comprehensiveData?.metadata?.totalTransactions || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common financial tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF Report
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter by Date Range
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Compare Periods
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Balance Sheet Tab */}
        <TabsContent value="balance-sheet" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Assets ({formatCurrency(totalAssets)})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {balanceSheetData?.assets?.current?.accounts?.map((account: any) => (
                    <div key={account.code} className="flex justify-between">
                      <span className="text-sm">{account.code} - {account.name}</span>
                      <span className="text-sm font-medium">{formatCurrency(account.balance)}</span>
                    </div>
                  ))}
                  {balanceSheetData?.assets?.nonCurrent?.accounts?.map((account: any) => (
                    <div key={account.code} className="flex justify-between">
                      <span className="text-sm">{account.code} - {account.name}</span>
                      <span className="text-sm font-medium">{formatCurrency(account.balance)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <TrendingDown className="mr-2 h-5 w-5" />
                    Liabilities ({formatCurrency(totalLiabilities)})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {balanceSheetData?.liabilities?.current?.accounts?.map((account: any) => (
                      <div key={account.code} className="flex justify-between">
                        <span className="text-sm">{account.code} - {account.name}</span>
                        <span className="text-sm font-medium">{formatCurrency(account.balance)}</span>
                      </div>
                    ))}
                    {balanceSheetData?.liabilities?.nonCurrent?.accounts?.map((account: any) => (
                      <div key={account.code} className="flex justify-between">
                        <span className="text-sm">{account.code} - {account.name}</span>
                        <span className="text-sm font-medium">{formatCurrency(account.balance)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-600">
                    <Wallet className="mr-2 h-5 w-5" />
                    Equity ({formatCurrency(equity)})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {balanceSheetData?.equity?.accounts?.map((account: any) => (
                      <div key={account.code} className="flex justify-between">
                        <span className="text-sm">{account.code} - {account.name}</span>
                        <span className="text-sm font-medium">{formatCurrency(account.balance)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Balance Sheet Validation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Balance Sheet Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalAssets)}</div>
                  <div className="text-sm text-muted-foreground">Total Assets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(totalLiabilities + equity)}
                  </div>
                  <div className="text-sm text-muted-foreground">Liabilities + Equity</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${Math.abs(totalAssets - (totalLiabilities + equity)) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(totalAssets - (totalLiabilities + equity)))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.abs(totalAssets - (totalLiabilities + equity)) < 0.01 ? 'Balanced ✓' : 'Out of Balance ✗'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Statement Tab */}
        <TabsContent value="income-statement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Revenue ({formatCurrency(totalRevenue)})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incomeStatementData?.revenues?.detail?.map((account: any) => (
                    <div key={account.code} className="flex justify-between">
                      <span className="text-sm">{account.code} - {account.name}</span>
                      <span className="text-sm font-medium">{formatCurrency(account.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <TrendingDown className="mr-2 h-5 w-5" />
                  Expenses ({formatCurrency(totalExpenses)})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incomeStatementData?.expenses?.detail?.map((account: any) => (
                    <div key={account.code} className="flex justify-between">
                      <span className="text-sm">{account.code} - {account.name}</span>
                      <span className="text-sm font-medium">{formatCurrency(account.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profitability Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Profitability Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
                  <div className="text-sm text-muted-foreground">Total Expenses</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(netIncome)}
                  </div>
                  <div className="text-sm text-muted-foreground">Net Income</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalRevenue > 0 ? formatPercent((netIncome / totalRevenue) * 100) : '0%'}
                  </div>
                  <div className="text-sm text-muted-foreground">Profit Margin</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Revenue Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Categories</CardTitle>
                <CardDescription>Highest performing revenue streams</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={comprehensiveData?.analytics?.topRevenueCategories || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill={COLORS.revenue} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Expense Categories</CardTitle>
                <CardDescription>Highest expense categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={comprehensiveData?.analytics?.topExpenseCategories || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill={COLORS.expenses} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Account Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Account Type Distribution</CardTitle>
              <CardDescription>Breakdown of accounts by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                {comprehensiveData?.analytics?.accountTypeDistribution && (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {comprehensiveData.analytics.accountTypeDistribution.assets.count}
                      </div>
                      <div className="text-sm text-muted-foreground">Asset Accounts</div>
                      <div className="text-xs text-blue-600">
                        {formatCurrency(comprehensiveData.analytics.accountTypeDistribution.assets.total)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {comprehensiveData.analytics.accountTypeDistribution.liabilities.count}
                      </div>
                      <div className="text-sm text-muted-foreground">Liability Accounts</div>
                      <div className="text-xs text-red-600">
                        {formatCurrency(comprehensiveData.analytics.accountTypeDistribution.liabilities.total)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {comprehensiveData.analytics.accountTypeDistribution.equity.count}
                      </div>
                      <div className="text-sm text-muted-foreground">Equity Accounts</div>
                      <div className="text-xs text-green-600">
                        {formatCurrency(comprehensiveData.analytics.accountTypeDistribution.equity.total)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {comprehensiveData.analytics.accountTypeDistribution.revenue.count}
                      </div>
                      <div className="text-sm text-muted-foreground">Revenue Accounts</div>
                      <div className="text-xs text-purple-600">
                        {formatCurrency(comprehensiveData.analytics.accountTypeDistribution.revenue.total)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {comprehensiveData.analytics.accountTypeDistribution.expenses.count}
                      </div>
                      <div className="text-sm text-muted-foreground">Expense Accounts</div>
                      <div className="text-xs text-orange-600">
                        {formatCurrency(comprehensiveData.analytics.accountTypeDistribution.expenses.total)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Trial Balance</CardTitle>
                <CardDescription>Account balances validation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Trial Balance shows:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Total Debits: {formatCurrency(comprehensiveData?.trialBalance?.validation?.totalDebits || 0)}</li>
                    <li>Total Credits: {formatCurrency(comprehensiveData?.trialBalance?.validation?.totalCredits || 0)}</li>
                    <li>Balanced: {comprehensiveData?.trialBalance?.validation?.balanced ? '✓ Yes' : '✗ No'}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Summary</CardTitle>
                <CardDescription>Operating cash flow analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Cash Flow Summary:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Net Operating Cash Flow: {formatCurrency(comprehensiveData?.cashFlow?.summary?.netOperatingCashFlow || 0)}</li>
                    <li>Average Monthly Cash Flow: {formatCurrency(comprehensiveData?.cashFlow?.summary?.averageMonthlyCashFlow || 0)}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}