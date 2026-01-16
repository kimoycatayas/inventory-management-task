import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Snackbar,
  Skeleton,
  TablePagination,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import InventoryIcon from "@mui/icons-material/Inventory";
import AppLayout from "@/components/AppLayout";
import DashboardCard from "@/components/DashboardCard";

export default function Alerts() {
  // Data state
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  // Filter state
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStockStatus, setFilterStockStatus] = useState("all");

  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionType, setActionType] = useState(null); // 'acknowledge', 'resolve', 'dismiss'
  const [notes, setNotes] = useState("");

  // Feedback state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/alerts?regenerate=true");
      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      setError("Failed to load alerts. Please try again.");
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/alerts?regenerate=true");
      if (!response.ok) {
        throw new Error("Failed to regenerate alerts");
      }
      const data = await response.json();
      setAlerts(data);
      setSnackbar({
        open: true,
        message: "Alerts regenerated successfully",
        severity: "success",
      });
    } catch (err) {
      setError("Failed to regenerate alerts. Please try again.");
      setSnackbar({
        open: true,
        message: "Failed to regenerate alerts",
        severity: "error",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleOpenDialog = (alert, action) => {
    setSelectedAlert(alert);
    setActionType(action);
    setNotes(alert.notes || "");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAlert(null);
    setActionType(null);
    setNotes("");
  };

  const handleUpdateAlert = async () => {
    if (!selectedAlert) return;

    try {
      const newStatus =
        actionType === "acknowledge"
          ? "acknowledged"
          : actionType === "resolve"
          ? "resolved"
          : actionType === "dismiss"
          ? "dismissed"
          : selectedAlert.status;

      const response = await fetch(`/api/alerts/${selectedAlert.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update alert");
      }

      // Refresh alerts
      await fetchAlerts();

      setSnackbar({
        open: true,
        message: `Alert ${
          actionType === "acknowledge"
            ? "acknowledged"
            : actionType === "resolve"
            ? "resolved"
            : "dismissed"
        } successfully`,
        severity: "success",
      });

      handleCloseDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to update alert",
        severity: "error",
      });
    }
  };

  // Filter and paginate alerts
  const filteredAlerts = useMemo(() => {
    let filtered = [...alerts];

    if (filterStatus !== "all") {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }

    if (filterStockStatus !== "all") {
      filtered = filtered.filter((a) => a.stockStatus === filterStockStatus);
    }

    return filtered;
  }, [alerts, filterStatus, filterStockStatus]);

  const paginatedAlerts = useMemo(() => {
    return filteredAlerts.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredAlerts, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    const active = alerts.filter((a) => a.status === "active").length;
    const critical = alerts.filter(
      (a) =>
        a.stockStatus === "critical" &&
        a.status !== "resolved" &&
        a.status !== "dismissed"
    ).length;
    const low = alerts.filter(
      (a) =>
        a.stockStatus === "low" &&
        a.status !== "resolved" &&
        a.status !== "dismissed"
    ).length;
    const overstocked = alerts.filter(
      (a) =>
        a.stockStatus === "overstocked" &&
        a.status !== "resolved" &&
        a.status !== "dismissed"
    ).length;
    return { active, critical, low, overstocked };
  }, [alerts]);

  const getStatusColor = (stockStatus) => {
    switch (stockStatus) {
      case "critical":
        return "error";
      case "low":
        return "warning";
      case "overstocked":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusIcon = (stockStatus) => {
    switch (stockStatus) {
      case "critical":
        return <WarningIcon fontSize="small" />;
      case "low":
        return <WarningIcon fontSize="small" />;
      case "overstocked":
        return <InventoryIcon fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: "100%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Low Stock Alerts & Reorder System
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor inventory levels and get actionable reorder
              recommendations.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Tooltip title="Regenerate alerts based on current stock levels">
              <Button
                variant="outlined"
                startIcon={
                  regenerating ? (
                    <CircularProgress size={16} />
                  ) : (
                    <RefreshIcon />
                  )
                }
                onClick={handleRegenerate}
                disabled={regenerating || loading}
              >
                {regenerating ? "Regenerating..." : "Regenerate Alerts"}
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchAlerts}>
                Retry
              </Button>
            }
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard>
              <Typography variant="body2" color="text.secondary">
                Active Alerts
              </Typography>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                {summary.active}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Requiring attention
              </Typography>
            </DashboardCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard>
              <Typography variant="body2" color="text.secondary">
                Critical Stock
              </Typography>
              <Typography
                variant="h5"
                sx={{ mt: 1, fontWeight: 700, color: "error.main" }}
              >
                {summary.critical}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Below 25% of reorder point
              </Typography>
            </DashboardCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard>
              <Typography variant="body2" color="text.secondary">
                Low Stock
              </Typography>
              <Typography
                variant="h5"
                sx={{ mt: 1, fontWeight: 700, color: "warning.main" }}
              >
                {summary.low}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                26-50% of reorder point
              </Typography>
            </DashboardCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DashboardCard>
              <Typography variant="body2" color="text.secondary">
                Overstocked
              </Typography>
              <Typography
                variant="h5"
                sx={{ mt: 1, fontWeight: 700, color: "info.main" }}
              >
                {summary.overstocked}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Above 150% of reorder point
              </Typography>
            </DashboardCard>
          </Grid>
        </Grid>

        {/* Alerts Table */}
        <DashboardCard
          title="Inventory Alerts"
          subtitle="View and manage stock alerts with reorder recommendations"
          action={
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Alert Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(0);
                  }}
                  label="Alert Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="dismissed">Dismissed</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Stock Status</InputLabel>
                <Select
                  value={filterStockStatus}
                  onChange={(e) => {
                    setFilterStockStatus(e.target.value);
                    setPage(0);
                  }}
                  label="Stock Status"
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="overstocked">Overstocked</MenuItem>
                </Select>
              </FormControl>
            </Box>
          }
        >
          {loading ? (
            <Box sx={{ mt: 2 }}>
              <Skeleton variant="rectangular" height={400} />
            </Box>
          ) : filteredAlerts.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              {filterStatus !== "all" || filterStockStatus !== "all"
                ? "No alerts match your filters."
                : "No alerts found. All products are adequately stocked."}
            </Alert>
          ) : (
            <>
              <TableContainer sx={{ mt: 2 }}>
                <Table aria-label="Stock alerts table">
                  <TableHead>
                    <TableRow>
                      <TableCell component="th" scope="col">Product</TableCell>
                      <TableCell component="th" scope="col" align="right">Current Stock</TableCell>
                      <TableCell component="th" scope="col" align="right">Reorder Point</TableCell>
                      <TableCell component="th" scope="col" align="center">Stock Status</TableCell>
                      <TableCell component="th" scope="col" align="right">Recommended Order</TableCell>
                      <TableCell component="th" scope="col" align="center">Alert Status</TableCell>
                      <TableCell component="th" scope="col">Warehouses</TableCell>
                      <TableCell component="th" scope="col" align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedAlerts.map((alert) => (
                      <TableRow
                        key={alert.id}
                        hover
                        sx={{
                          backgroundColor:
                            alert.stockStatus === "critical"
                              ? "rgba(244, 67, 54, 0.08)"
                              : alert.stockStatus === "low"
                              ? "rgba(255, 152, 0, 0.12)"
                              : "inherit",
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {alert.productName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {alert.productSku} • {alert.productCategory}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {alert.currentStock.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {alert.reorderPoint.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={getStatusIcon(alert.stockStatus)}
                            label={alert.stockStatus.toUpperCase()}
                            color={getStatusColor(alert.stockStatus)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {alert.recommendedReorderQuantity > 0 ? (
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: "primary.main" }}
                            >
                              {alert.recommendedReorderQuantity.toLocaleString()}{" "}
                              units
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={alert.status}
                            color={
                              alert.status === "active"
                                ? "error"
                                : alert.status === "acknowledged"
                                ? "warning"
                                : alert.status === "resolved"
                                ? "success"
                                : "default"
                            }
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.5,
                            }}
                          >
                            {alert.warehouses.map((wh) => (
                              <Typography
                                key={wh.warehouseId}
                                variant="caption"
                                color="text.secondary"
                              >
                                {wh.warehouseName}:{" "}
                                {wh.quantity.toLocaleString()}
                              </Typography>
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              justifyContent: "center",
                            }}
                          >
                            {alert.status === "active" && (
                              <>
                                <Tooltip title="Acknowledge">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() =>
                                      handleOpenDialog(alert, "acknowledge")
                                    }
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Resolve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() =>
                                      handleOpenDialog(alert, "resolve")
                                    }
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            <Tooltip title="Dismiss">
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() =>
                                  handleOpenDialog(alert, "dismiss")
                                }
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Product">
                              <IconButton
                                size="small"
                                component={Link}
                                href={`/products/edit/${alert.productId}`}
                                color="primary"
                              >
                                <InventoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredAlerts.length}
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
      </Box>
      {/* Action Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        aria-labelledby="alert-action-dialog-title"
      >
        <DialogTitle id="alert-action-dialog-title">
          {actionType === "acknowledge"
            ? "Acknowledge Alert"
            : actionType === "resolve"
            ? "Resolve Alert"
            : "Dismiss Alert"}
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <>
              <DialogContentText>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Product:</strong> {selectedAlert.productName} (
                  {selectedAlert.productSku})
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Current Stock:</strong>{" "}
                  {selectedAlert.currentStock.toLocaleString()} units
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Stock Status:</strong>{" "}
                  <Chip
                    label={selectedAlert.stockStatus.toUpperCase()}
                    color={getStatusColor(selectedAlert.stockStatus)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </DialogContentText>
              <TextField
                fullWidth
                label="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                placeholder="Add notes about this action..."
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleUpdateAlert}
            variant="contained"
            color={
              actionType === "resolve"
                ? "success"
                : actionType === "acknowledge"
                ? "warning"
                : "default"
            }
          >
            {actionType === "acknowledge"
              ? "Acknowledge"
              : actionType === "resolve"
              ? "Resolve"
              : "Dismiss"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          role={snackbar.severity === "error" ? "alert" : "status"}
          aria-live={snackbar.severity === "error" ? "assertive" : "polite"}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
