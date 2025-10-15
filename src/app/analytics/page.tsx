"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Calendar,
  Target,
  Zap,
  AlertCircle,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Clock
} from "lucide-react";

interface AnalyticsData {
  period: {
    from: string;
    to: string;
    type: string;
  };
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    profitMargin: string;
    averageMonthlyGrowth: string;
    netCashFlow: number;
    operatingExpenses: number;
    grossProfit: number;
    expenseRatio: string;
  };
  quickStats: {
    revenue: {
      value: number;
      change: string;
      trend: 'up' | 'down';
    };
    expenses: {
      value: number;
      change: string;
      trend: 'up' | 'down';
    };
    profit: {
      value: number;
      change: string;
      trend: 'up' | 'down';
    };
    cashFlow: {
      value: number;
      change: string;
      trend: 'up' | 'down';
    };
  };
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    date: string;
  }>;
  expenseBreakdown: Array<{
    name: string;
    code: string;
    value: number;
    percentage: string;
  }>;
  revenueSources: Array<{
    name: string;
    code: string;
    value: number;
    percentage: string;
  }>;
  growthMetrics: {
    monthlyGrowthRates: Array<{
      month: string;
      revenueGrowth: string;
    }>;
    averageGrowthRate: string;
    totalMonths: number;
  };
  previousPeriod: {
    from: string;
    to: string;
    revenue: number;
    expenses: number;
    profit: number;
    cashFlow: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('last12months');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await fetch(`/api/analytics?period=${period}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
        setLastUpdated(new Date());
      } else {
        setError('Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Error loading analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    fetchAnalytics(true);
  };

  const handleExport = () => {
    if (!data) return;

    // Enhanced CSV export with comprehensive analytics data
    const csvContent = [
      ['Analytics Report', '', '', '', `Generated: ${new Date().toLocaleString()}`],
      ['Period:', data.period.from, 'to', data.period.to, `Type: ${data.period.type}`],
      ['', '', '', '', ''],
      ['KEY PERFORMANCE INDICATORS', '', '', '', ''],
      ['Metric', 'Value', 'Previous Period', 'Change', 'Trend'],
      ['Total Revenue', data.kpis.totalRevenue.toFixed(2), data.previousPeriod.revenue.toFixed(2), data.quickStats.revenue.change + '%', data.quickStats.revenue.trend],
      ['Total Expenses', data.kpis.totalExpenses.toFixed(2), data.previousPeriod.expenses.toFixed(2), data.quickStats.expenses.change + '%', data.quickStats.expenses.trend],
      ['Total Profit', data.kpis.totalProfit.toFixed(2), data.previousPeriod.profit.toFixed(2), data.quickStats.profit.change + '%', data.quickStats.profit.trend],
      ['Net Cash Flow', data.kpis.netCashFlow.toFixed(2), data.previousPeriod.cashFlow.toFixed(2), data.quickStats.cashFlow.change + '%', data.quickStats.cashFlow.trend],
      ['Profit Margin', data.kpis.profitMargin + '%', '', '', ''],
      ['Expense Ratio', data.kpis.expenseRatio + '%', '', '', ''],
      ['Average Monthly Growth', data.kpis.averageMonthlyGrowth + '%', '', '', ''],
      ['', '', '', '', ''],
      ['MONTHLY TRENDS', '', '', '', ''],
      ['Month', 'Revenue', 'Expenses', 'Profit', 'Date'],
      ...data.monthlyTrends.map(month => [
        month.month,
        month.revenue.toFixed(2),
        month.expenses.toFixed(2),
        month.profit.toFixed(2),
        month.date
      ]),
      ['', '', '', '', ''],
      ['EXPENSE BREAKDOWN', '', '', '', ''],
      ['Category', 'Amount', 'Percentage', 'Code', ''],
      ...data.expenseBreakdown.map(expense => [
        expense.name,
        expense.value.toFixed(2),
        expense.percentage + '%',
        expense.code,
        ''
      ]),
      ['', '', '', '', ''],
      ['REVENUE SOURCES', '', '', '', ''],
      ['Source', 'Amount', 'Percentage', 'Code', ''],
      ...data.revenueSources.map(revenue => [
        revenue.name,
        revenue.value.toFixed(2),
        revenue.percentage + '%',
        revenue.code,
        ''
      ]),
      ['', '', '', '', ''],
      ['MONTHLY GROWTH RATES', '', '', '', ''],
      ['Month', 'Revenue Growth (%)', '', '', ''],
      ...data.growthMetrics.monthlyGrowthRates.map(growth => [
        growth.month,
        growth.revenueGrowth,
        '', '', ''
      ]),
      ['', '', '', '', ''],
      ['SUMMARY', '', '', '', ''],
      ['Metric', 'Value', '', '', ''],
      ['Total Months Analyzed', data.growthMetrics.totalMonths, '', '', ''],
      ['Average Growth Rate', data.growthMetrics.averageGrowthRate + '%', '', '', ''],
      ['Total Revenue Sources', data.revenueSources.length, '', '', ''],
      ['Total Expense Categories', data.expenseBreakdown.length, '', '', '']
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${data.period.from}-to-${data.period.to}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="animate-pulse">
              <Activity className="h-4 w-4 mr-1" />
              Loading Analytics...
            </Badge>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Processing financial data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        </div>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-medium">Error Loading Analytics</p>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const profitLossColor = data.kpis.totalProfit >= 0 ? 'text-green-600' : 'text-red-600';
  const profitLossIcon = data.kpis.totalProfit >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last12months">Last 12 Months</SelectItem>
              <SelectItem value="currentYear">Current Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="relative"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats Section */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800">Quick Stats</CardTitle>
            {lastUpdated && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
          <CardDescription>
            Key performance indicators with period-over-period comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Revenue Quick Stat */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Revenue</p>
                  <p className="text-lg font-bold text-slate-900">
                    ${data.quickStats.revenue.value.toFixed(0)}
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 ${data.quickStats.revenue.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {data.quickStats.revenue.trend === 'up' ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                <span className="text-xs font-medium">
                  {Math.abs(parseFloat(data.quickStats.revenue.change)).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Expenses Quick Stat */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Expenses</p>
                  <p className="text-lg font-bold text-slate-900">
                    ${data.quickStats.expenses.value.toFixed(0)}
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 ${data.quickStats.expenses.trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                {data.quickStats.expenses.trend === 'up' ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                <span className="text-xs font-medium">
                  {Math.abs(parseFloat(data.quickStats.expenses.change)).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Profit Quick Stat */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${data.quickStats.profit.value >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <DollarSign className={`h-4 w-4 ${data.quickStats.profit.value >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Profit</p>
                  <p className={`text-lg font-bold ${data.quickStats.profit.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${data.quickStats.profit.value.toFixed(0)}
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 ${data.quickStats.profit.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {data.quickStats.profit.trend === 'up' ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                <span className="text-xs font-medium">
                  {Math.abs(parseFloat(data.quickStats.profit.change)).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Cash Flow Quick Stat */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${data.quickStats.cashFlow.value >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                  <Activity className={`h-4 w-4 ${data.quickStats.cashFlow.value >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Cash Flow</p>
                  <p className={`text-lg font-bold ${data.quickStats.cashFlow.value >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    ${data.quickStats.cashFlow.value.toFixed(0)}
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 ${data.quickStats.cashFlow.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {data.quickStats.cashFlow.trend === 'up' ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                <span className="text-xs font-medium">
                  {Math.abs(parseFloat(data.quickStats.cashFlow.change)).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${data.kpis.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Growth: {data.kpis.averageMonthlyGrowth}% avg/month
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
              ${data.kpis.totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.kpis.expenseRatio}% of revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <profitLossIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitLossColor}`}>
              ${data.kpis.totalProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.kpis.profitMargin}% profit margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.kpis.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${data.kpis.netCashFlow.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Cash in - Cash out
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Revenue & Expense Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Expense Breakdown</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Sources</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Revenue vs Expenses Trend</CardTitle>
                <CardDescription>
                  Monthly revenue and expenses over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#00C49F"
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#FF8042"
                      strokeWidth={2}
                      name="Expenses"
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#8884D8"
                      strokeWidth={2}
                      name="Profit"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cumulative Performance</CardTitle>
                <CardDescription>
                  Running total of revenue and expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#00C49F" fill="#00C49F" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="expenses" stackId="1" stroke="#FF8042" fill="#FF8042" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Profit/Loss</CardTitle>
                <CardDescription>
                  Monthly profit performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Bar dataKey="profit" fill="#8884D8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>
                  Breakdown of expenses by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Details</CardTitle>
                <CardDescription>
                  Top expense categories by amount
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.expenseBreakdown.slice(0, 5).map((expense, index) => (
                    <div key={expense.code} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{expense.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${expense.value.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{expense.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
                <CardDescription>
                  Breakdown of revenue by source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.revenueSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.revenueSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Details</CardTitle>
                <CardDescription>
                  Top revenue sources by amount
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.revenueSources.slice(0, 5).map((revenue, index) => (
                    <div key={revenue.code} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{revenue.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${revenue.value.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{revenue.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.kpis.profitMargin}%</div>
                <p className="text-xs text-muted-foreground">
                  Profit as percentage of revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Expense Ratio</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.kpis.expenseRatio}%</div>
                <p className="text-xs text-muted-foreground">
                  Expenses as percentage of revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Average Monthly Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.kpis.averageMonthlyGrowth}%</div>
                <p className="text-xs text-muted-foreground">
                  Average revenue growth per month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Growth Rates</CardTitle>
              <CardDescription>
                Month-over-month revenue growth percentage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.growthMetrics.monthlyGrowthRates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Bar dataKey="revenueGrowth" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}