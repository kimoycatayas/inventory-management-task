import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Typography,
  Box,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Alert,
  Skeleton,
  TablePagination,
  TableSortLabel,
  Tooltip,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  LinearProgress,
  useTheme,
  Menu,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardCard from '@/components/DashboardCard';
import WarningIcon from '@mui/icons-material/Warning';
import { exportToCsv } from '@/lib/exportCsv';
import { exportToPdf } from '@/lib/exportPdf';

const LOW_STOCK_THRESHOLD = 10;

export default function Home() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { products, warehouses, stock, loading, error, lastUpdated, refresh } = useDashboardData();
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [timeframe, setTimeframe] = useState('month');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportSnackbar, setExportSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Theme-aware chart colors
  const chartGridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e4e1d8';
  const chartTickColor = isDark ? '#b0b0b0' : '#6b6b6b';
  const chartTooltipBg = isDark ? '#2a2a2a' : '#ffffff';
  const chartTooltipBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0,0,0,0.08)';
  const chartTooltipShadow = isDark ? '0 6px 16px rgba(0, 0, 0, 0.4)' : '0 6px 16px rgba(0,0,0,0.08)';

  // Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      setAlertsLoading(true);
      try {
        const response = await fetch('/api/alerts');
        if (response.ok) {
          const data = await response.json();
          setAlerts(data);
        }
      } catch (err) {
        console.error('Error fetching alerts:', err);
      } finally {
        setAlertsLoading(false);
      }
    };
    fetchAlerts();
  }, [lastUpdated]);

  const kpis = useMemo(() => {
    const totalUnits = stock.reduce((sum, item) => sum + item.quantity, 0);
    const totalInventoryValue = stock.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product ? product.unitCost * item.quantity : 0);
    }, 0);
    const lowStockItems = products.filter((product) => {
      const productStock = stock.filter((s) => s.productId === product.id);
      const totalQuantity = productStock.reduce((sum, s) => sum + s.quantity, 0);
      return totalQuantity > 0 && totalQuantity <= LOW_STOCK_THRESHOLD;
    }).length;

    return {
      totalInventoryValue,
      totalUnits,
      productCount: products.length,
      warehouseCount: warehouses.length,
      lowStockItems,
    };
  }, [products, warehouses, stock]);

  const chartData = useMemo(() => {
    const stockByWarehouse = warehouses.map((warehouse) => {
      const warehouseStock = stock.filter((s) => s.warehouseId === warehouse.id);
      const totalQuantity = warehouseStock.reduce((sum, s) => sum + s.quantity, 0);
      return {
        name: warehouse.name,
        code: warehouse.code,
        quantity: totalQuantity,
      };
    });

    const valueByWarehouse = warehouses.map((warehouse) => {
      const warehouseStock = stock.filter((s) => s.warehouseId === warehouse.id);
      const totalValue = warehouseStock.reduce((sum, s) => {
        const product = products.find((p) => p.id === s.productId);
        return sum + (product ? product.unitCost * s.quantity : 0);
      }, 0);
      return {
        name: warehouse.name,
        code: warehouse.code,
        value: totalValue,
      };
    });

    const productTotals = products
      .map((product) => {
        const productStock = stock.filter((s) => s.productId === product.id);
        const totalQuantity = productStock.reduce((sum, s) => sum + s.quantity, 0);
        return {
          name: product.name,
          sku: product.sku,
          quantity: totalQuantity,
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      stockByWarehouse,
      valueByWarehouse,
      topProducts: productTotals,
    };
  }, [products, warehouses, stock]);

  const inventoryOverview = useMemo(() => {
    let overview = products.map((product) => {
      const productStock = stock.filter((s) => s.productId === product.id);
      const totalQuantity = productStock.reduce((sum, s) => sum + s.quantity, 0);
      const totalValue = productStock.reduce((sum, s) => {
        return sum + product.unitCost * s.quantity;
      }, 0);

      let status = 'OK';
      if (totalQuantity === 0) {
        status = 'Out';
      } else if (totalQuantity <= LOW_STOCK_THRESHOLD) {
        status = 'Low';
      }

      return {
        ...product,
        totalQuantity,
        totalValue,
        status,
      };
    });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      overview = overview.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    overview.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return overview;
  }, [products, stock, searchQuery, sortField, sortDirection]);

  const paginatedOverview = useMemo(() => {
    return inventoryOverview.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [inventoryOverview, page, rowsPerPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const averageValuePerWarehouse = useMemo(() => {
    return kpis.warehouseCount ? kpis.totalInventoryValue / kpis.warehouseCount : 0;
  }, [kpis.totalInventoryValue, kpis.warehouseCount]);

  const averageUnitsPerWarehouse = useMemo(() => {
    return kpis.warehouseCount ? kpis.totalUnits / kpis.warehouseCount : 0;
  }, [kpis.totalUnits, kpis.warehouseCount]);

  const topProductMax = chartData.topProducts[0]?.quantity || 0;

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const prepareExportData = () => {
    const columns = [
      { id: 'name', label: 'Product Name' },
      { id: 'sku', label: 'SKU' },
      { id: 'category', label: 'Category' },
      { id: 'totalQuantity', label: 'Total Stock' },
      { id: 'totalValue', label: 'Total Value' },
      { id: 'status', label: 'Status' },
    ];

    const rows = inventoryOverview.map((item) => ({
      name: item.name,
      sku: item.sku,
      category: item.category,
      totalQuantity: item.totalQuantity,
      totalValue: item.totalValue,
      status: item.status,
    }));

    return { columns, rows };
  };

  const handleExportCsv = () => {
    if (inventoryOverview.length === 0) {
      setExportSnackbar({
        open: true,
        message: 'No data to export',
        severity: 'warning',
      });
      handleExportMenuClose();
      return;
    }

    setExporting(true);
    handleExportMenuClose();

    try {
      const { columns, rows } = prepareExportData();
      exportToCsv({
        filename: 'inventory-overview',
        columns,
        rows,
      });
      setExportSnackbar({
        open: true,
        message: 'CSV export completed successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setExportSnackbar({
        open: true,
        message: 'Failed to export CSV',
        severity: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (inventoryOverview.length === 0) {
      setExportSnackbar({
        open: true,
        message: 'No data to export',
        severity: 'warning',
      });
      handleExportMenuClose();
      return;
    }

    setExporting(true);
    handleExportMenuClose();

    try {
      const { columns, rows } = prepareExportData();
      await exportToPdf({
        title: 'Inventory Overview Report',
        subtitle: `Generated on ${new Date().toLocaleDateString()}${searchQuery ? ' (Filtered)' : ''}`,
        columns,
        rows,
        filename: 'inventory-overview',
      });
      setExportSnackbar({
        open: true,
        message: 'PDF export completed successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setExportSnackbar({
        open: true,
        message: 'Failed to export PDF',
        severity: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleCloseExportSnackbar = () => {
    setExportSnackbar({ ...exportSnackbar, open: false });
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Hi, here&apos;s what&apos;s happening in your warehouses
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sustainable, low-waste operations powered by live inventory signals.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={timeframe}
            exclusive
            onChange={(event, nextValue) => nextValue && setTimeframe(nextValue)}
            size="small"
          >
            <ToggleButton value="today">Today</ToggleButton>
            <ToggleButton value="week">This Week</ToggleButton>
            <ToggleButton value="month">This Month</ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={selectedWarehouse}
              onChange={(event) => setSelectedWarehouse(event.target.value)}
            >
              <MenuItem value="all">All Warehouses</MenuItem>
              {warehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary">
                Updated {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
            <Tooltip title="Refresh data">
              <IconButton onClick={refresh} color="primary" disabled={loading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refresh}>
              Retry
            </Button>
          }
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Grid key={index} item xs={12} sm={6} md={4}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))
        ) : (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <DashboardCard>
                <Typography variant="body2" color="text.secondary">
                  Total inventory value
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                  ${kpis.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Across all warehouses
                </Typography>
              </DashboardCard>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DashboardCard>
                <Typography variant="body2" color="text.secondary">
                  Total units on hand
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                  {kpis.totalUnits.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Units in stock today
                </Typography>
              </DashboardCard>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DashboardCard>
                <Typography variant="body2" color="text.secondary">
                  Active products
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                  {kpis.productCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Unique SKUs tracked
                </Typography>
              </DashboardCard>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DashboardCard>
                <Typography variant="body2" color="text.secondary">
                  Warehouse locations
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                  {kpis.warehouseCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Distribution network
                </Typography>
              </DashboardCard>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DashboardCard>
                <Typography variant="body2" color="text.secondary">
                  Low stock count
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: 'warning.main' }}>
                  {kpis.lowStockItems}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Items below {LOW_STOCK_THRESHOLD} units
                </Typography>
              </DashboardCard>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box
                component={Link}
                href="/alerts"
                sx={{
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                <DashboardCard
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 4,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Active alerts
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: 'error.main' }}>
                        {alertsLoading ? '...' : alerts.filter((a) => a.status === 'active').length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {alertsLoading
                          ? 'Loading...'
                          : alerts.filter((a) => a.stockStatus === 'critical' && a.status !== 'resolved' && a.status !== 'dismissed').length > 0
                          ? `${alerts.filter((a) => a.stockStatus === 'critical' && a.status !== 'resolved' && a.status !== 'dismissed').length} critical`
                          : 'Requiring attention'}
                      </Typography>
                    </Box>
                    <WarningIcon sx={{ color: 'error.main', fontSize: 32 }} />
                  </Box>
                </DashboardCard>
              </Box>
            </Grid>
          </>
        )}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          {loading ? (
            <Skeleton variant="rectangular" height={320} />
          ) : (
            <DashboardCard
              title="Stock movement"
              subtitle="Units stored per warehouse location"
              sx={{ height: '100%' }}
            >
              <Box sx={{ mt: 2, height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.stockByWarehouse} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={chartGridColor} vertical={false} />
                    <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTickColor }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTickColor }} />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: `1px solid ${chartTooltipBorder}`,
                        boxShadow: chartTooltipShadow,
                        backgroundColor: chartTooltipBg,
                        color: theme.palette.text.primary,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="quantity"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      fill="url(#stockGradient)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </DashboardCard>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {loading ? (
            <Skeleton variant="rectangular" height={320} />
          ) : (
            <DashboardCard
              title="Inventory value trend"
              subtitle="Estimated value by warehouse"
              sx={{ height: '100%' }}
            >
              <Box sx={{ mt: 2, height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.valueByWarehouse} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.light} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={theme.palette.primary.light} stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={chartGridColor} vertical={false} />
                    <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTickColor }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: chartTickColor }}
                      tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                    />
                    <RechartsTooltip
                      formatter={(value) =>
                        `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                      contentStyle={{
                        borderRadius: 10,
                        border: `1px solid ${chartTooltipBorder}`,
                        boxShadow: chartTooltipShadow,
                        backgroundColor: chartTooltipBg,
                        color: theme.palette.text.primary,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={theme.palette.primary.light}
                      strokeWidth={2}
                      fill="url(#valueGradient)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </DashboardCard>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {loading ? (
            <Skeleton variant="rectangular" height={320} />
          ) : (
            <DashboardCard title="Warehouse stats" subtitle="Quick averages and alerts" sx={{ height: '100%' }}>
              <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Average value per warehouse
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    ${averageValuePerWarehouse.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Average units per warehouse
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {Math.round(averageUnitsPerWarehouse).toLocaleString()}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Low stock count
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {kpis.lowStockItems}
                  </Typography>
                </Box>
              </Box>
            </DashboardCard>
          )}
        </Grid>
      </Grid>

      {/* Critical Alerts Section */}
      {!alertsLoading && alerts.filter((a) => a.status === 'active' && a.stockStatus === 'critical').length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <DashboardCard
              title="Critical Stock Alerts"
              subtitle="Products requiring immediate attention"
              action={
                <Button component={Link} href="/alerts" variant="outlined" size="small">
                  View All Alerts
                </Button>
              }
            >
              <Box sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {alerts.filter((a) => a.status === 'active' && a.stockStatus === 'critical').length} critical
                    alert{alerts.filter((a) => a.status === 'active' && a.stockStatus === 'critical').length !== 1 ? 's' : ''}{' '}
                    requiring immediate action
                  </Typography>
                </Alert>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Current Stock</TableCell>
                        <TableCell align="right">Reorder Point</TableCell>
                        <TableCell align="right">Recommended Order</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {alerts
                        .filter((a) => a.status === 'active' && a.stockStatus === 'critical')
                        .slice(0, 5)
                        .map((alert) => (
                          <TableRow key={alert.id} sx={{ bgcolor: isDark ? 'rgba(244, 67, 54, 0.16)' : 'rgba(244, 67, 54, 0.08)' }}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {alert.productName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {alert.productSku}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                                {alert.currentStock.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary">
                                {alert.reorderPoint.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {alert.recommendedReorderQuantity.toLocaleString()} units
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                component={Link}
                                href="/alerts"
                                variant="outlined"
                                color="error"
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </DashboardCard>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={5}>
          {loading ? (
            <Skeleton variant="rectangular" height={300} />
          ) : (
            <DashboardCard
              title="Top 10 products by total quantity"
              subtitle="Highest stocked products across all warehouses"
              sx={{ height: '100%' }}
            >
              <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
                {chartData.topProducts.map((item) => (
                  <Box key={item.sku}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.quantity.toLocaleString()}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={topProductMax ? (item.quantity / topProductMax) * 100 : 0}
                      sx={{
                        height: 6,
                        borderRadius: 10,
                        bgcolor: isDark ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'primary.main',
                          borderRadius: 10,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </DashboardCard>
          )}
        </Grid>
        <Grid item xs={12} md={7}>
          <DashboardCard
            title="Inventory overview"
            subtitle="Search, sort, and manage current stock positions"
            action={
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={exporting ? <CircularProgress size={16} /> : <FileDownloadIcon />}
                  endIcon={<ArrowDropDownIcon />}
                  onClick={handleExportMenuOpen}
                  disabled={exporting || inventoryOverview.length === 0}
                >
                  Export
                </Button>
                <Menu
                  anchorEl={exportMenuAnchor}
                  open={Boolean(exportMenuAnchor)}
                  onClose={handleExportMenuClose}
                >
                  <MenuItem onClick={handleExportCsv} disabled={exporting || inventoryOverview.length === 0}>
                    Export CSV
                  </MenuItem>
                  <MenuItem onClick={handleExportPdf} disabled={exporting || inventoryOverview.length === 0}>
                    Export PDF
                  </MenuItem>
                </Menu>
                <TextField
                  placeholder="Search products..."
                  size="small"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: { xs: '100%', sm: 260 } }}
                />
              </Box>
            }
          >
            {loading ? (
              <Box sx={{ mt: 2 }}>
                <Skeleton variant="rectangular" height={360} />
              </Box>
            ) : inventoryOverview.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                {searchQuery
                  ? 'No products match your search criteria.'
                  : 'No products available. Add your first product to get started.'}
              </Alert>
            ) : (
              <>
                <TableContainer sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <TableSortLabel
                            active={sortField === 'name'}
                            direction={sortField === 'name' ? sortDirection : 'asc'}
                            onClick={() => handleSort('name')}
                          >
                            Product Name
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortField === 'sku'}
                            direction={sortField === 'sku' ? sortDirection : 'asc'}
                            onClick={() => handleSort('sku')}
                          >
                            SKU
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortField === 'category'}
                            direction={sortField === 'category' ? sortDirection : 'asc'}
                            onClick={() => handleSort('category')}
                          >
                            Category
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel
                            active={sortField === 'totalQuantity'}
                            direction={sortField === 'totalQuantity' ? sortDirection : 'asc'}
                            onClick={() => handleSort('totalQuantity')}
                          >
                            Total Stock
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel
                            active={sortField === 'totalValue'}
                            direction={sortField === 'totalValue' ? sortDirection : 'asc'}
                            onClick={() => handleSort('totalValue')}
                          >
                            Total Value
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedOverview.map((item) => (
                        <TableRow
                          key={item.id}
                            sx={{
                            backgroundColor:
                              item.status === 'Out'
                                ? isDark ? 'rgba(244, 67, 54, 0.16)' : 'rgba(244, 67, 54, 0.08)'
                                : item.status === 'Low'
                                ? isDark ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.12)'
                                : 'inherit',
                          }}
                        >
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell align="right">{item.totalQuantity.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            ${item.totalValue.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item.status}
                              color={
                                item.status === 'Out'
                                  ? 'error'
                                  : item.status === 'Low'
                                  ? 'warning'
                                  : 'success'
                              }
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              component={Link}
                              href={`/products/edit/${item.id}`}
                              variant="outlined"
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              component={Link}
                              href="/stock"
                              variant="text"
                              sx={{ ml: 1 }}
                            >
                              Manage Stock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={inventoryOverview.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  sx={{ mt: 1 }}
                />
              </>
            )}
          </DashboardCard>
        </Grid>
      </Grid>

      <Snackbar
        open={exportSnackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseExportSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseExportSnackbar} severity={exportSnackbar.severity} sx={{ width: '100%' }}>
          {exportSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
