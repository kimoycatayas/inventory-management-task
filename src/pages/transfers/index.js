import { useState, useEffect, useMemo } from "react";
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
  Paper,
  Divider,
  CircularProgress,
  Menu,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AppLayout from "@/components/AppLayout";
import DashboardCard from "@/components/DashboardCard";
import { exportToCsv } from "@/lib/exportCsv";
import { exportToPdf } from "@/lib/exportPdf";

export default function Transfers() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // Data state
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [productId, setProductId] = useState("");
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterWarehouseId, setFilterWarehouseId] = useState("all");
  const [filterProductId, setFilterProductId] = useState("all");

  // Feedback state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, warehousesData, transfersData, stockData] =
        await Promise.all([
          fetch("/api/products").then((res) => res.json()),
          fetch("/api/warehouses").then((res) => res.json()),
          fetch("/api/transfers").then((res) => res.json()),
          fetch("/api/stock").then((res) => res.json()),
        ]);
      setProducts(productsData);
      setWarehouses(warehousesData);
      setTransfers(transfersData);
      setStock(stockData);
    } catch (err) {
      setError("Failed to load data. Please try again.");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate available stock in source warehouse
  const availableStock = useMemo(() => {
    if (!productId || !fromWarehouseId) return null;
    const stockItem = stock.find(
      (s) =>
        s.productId === parseInt(productId) &&
        s.warehouseId === parseInt(fromWarehouseId)
    );
    return stockItem ? stockItem.quantity : 0;
  }, [productId, fromWarehouseId, stock]);

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      productId &&
      fromWarehouseId &&
      toWarehouseId &&
      fromWarehouseId !== toWarehouseId &&
      quantity &&
      parseInt(quantity) > 0 &&
      Number.isInteger(parseFloat(quantity)) &&
      availableStock !== null &&
      parseInt(quantity) <= availableStock
    );
  }, [productId, fromWarehouseId, toWarehouseId, quantity, availableStock]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: parseInt(productId),
          fromWarehouseId: parseInt(fromWarehouseId),
          toWarehouseId: parseInt(toWarehouseId),
          quantity: parseInt(quantity),
          note: note.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(data.message || "Insufficient stock for transfer");
        } else if (response.status === 400) {
          const errorMsg = data.errors
            ? data.errors.map((e) => e.message).join(", ")
            : data.message || "Validation failed";
          throw new Error(errorMsg);
        } else if (response.status === 404) {
          throw new Error(data.message || "Product or warehouse not found");
        } else {
          throw new Error(data.message || "Failed to create transfer");
        }
      }

      // Success
      setSnackbar({
        open: true,
        message: `Transfer completed successfully! ${quantity} units moved.`,
        severity: "success",
      });

      // Reset form
      setProductId("");
      setFromWarehouseId("");
      setToWarehouseId("");
      setQuantity("");
      setNote("");

      // Refresh data
      await fetchData();
    } catch (err) {
      setError(err.message || "Failed to create transfer");
      setSnackbar({
        open: true,
        message: err.message || "Failed to create transfer",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and paginate transfers
  const filteredTransfers = useMemo(() => {
    let filtered = [...transfers];

    if (filterWarehouseId !== "all") {
      const warehouseIdNum = parseInt(filterWarehouseId);
      filtered = filtered.filter(
        (t) =>
          t.fromWarehouseId === warehouseIdNum ||
          t.toWarehouseId === warehouseIdNum
      );
    }

    if (filterProductId !== "all") {
      const productIdNum = parseInt(filterProductId);
      filtered = filtered.filter((t) => t.productId === productIdNum);
    }

    return filtered;
  }, [transfers, filterWarehouseId, filterProductId]);

  const paginatedTransfers = useMemo(() => {
    return filteredTransfers.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredTransfers, page, rowsPerPage]);

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

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const prepareExportData = () => {
    const columns = [
      { id: "dateTime", label: "Date/Time" },
      { id: "product", label: "Product" },
      { id: "transfer", label: "Transfer" },
      { id: "quantity", label: "Quantity" },
      { id: "status", label: "Status" },
      { id: "note", label: "Note" },
    ];

    const rows = filteredTransfers.map((transfer) => ({
      dateTime: new Date(transfer.createdAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      product: transfer.productName,
      transfer: `${transfer.fromWarehouseName} → ${transfer.toWarehouseName}`,
      quantity: transfer.quantity,
      status: transfer.status,
      note: transfer.note || "",
    }));

    return { columns, rows };
  };

  const handleExportCsv = () => {
    if (filteredTransfers.length === 0) {
      setSnackbar({
        open: true,
        message: "No data to export",
        severity: "warning",
      });
      handleExportMenuClose();
      return;
    }

    setExporting(true);
    handleExportMenuClose();

    try {
      const { columns, rows } = prepareExportData();
      exportToCsv({
        filename: "stock-transfers",
        columns,
        rows,
      });
      setSnackbar({
        open: true,
        message: "CSV export completed successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      setSnackbar({
        open: true,
        message: "Failed to export CSV",
        severity: "error",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (filteredTransfers.length === 0) {
      setSnackbar({
        open: true,
        message: "No data to export",
        severity: "warning",
      });
      handleExportMenuClose();
      return;
    }

    setExporting(true);
    handleExportMenuClose();

    try {
      const { columns, rows } = prepareExportData();
      await exportToPdf({
        title: "Stock Transfers Report",
        subtitle: `Generated on ${new Date().toLocaleDateString()}${
          filterWarehouseId !== "all" || filterProductId !== "all"
            ? " (Filtered)"
            : ""
        }`,
        columns,
        rows,
        filename: "stock-transfers",
      });
      setSnackbar({
        open: true,
        message: "PDF export completed successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      setSnackbar({
        open: true,
        message: "Failed to export PDF",
        severity: "error",
      });
    } finally {
      setExporting(false);
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
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontSize: { xs: 22, sm: 28, md: 34 } }}
            >
              Stock Transfers
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Move inventory between warehouses with full audit trail.
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchData}>
                Retry
              </Button>
            }
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {/* Transfer Form */}
        <DashboardCard
          title="Create New Transfer"
          subtitle="Transfer inventory from one warehouse to another"
          sx={{ mb: 3 }}
        >
          {loading ? (
            <>
              <Box sx={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }} aria-live="polite" aria-atomic="true">
                Loading transfer form...
              </Box>
              <Box sx={{ py: 4 }}>
                <Skeleton variant="rectangular" height={300} aria-hidden="true" />
              </Box>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="transfer-product-label">Product</InputLabel>
                    <Select
                      value={productId}
                      onChange={(e) => {
                        setProductId(e.target.value);
                        setQuantity("");
                      }}
                      label="Product"
                      labelId="transfer-product-label"
                    >
                      {products.map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="transfer-from-warehouse-label">From Warehouse</InputLabel>
                    <Select
                      value={fromWarehouseId}
                      onChange={(e) => {
                        setFromWarehouseId(e.target.value);
                        if (e.target.value === toWarehouseId) {
                          setToWarehouseId("");
                        }
                        setQuantity("");
                      }}
                      label="From Warehouse"
                      labelId="transfer-from-warehouse-label"
                    >
                      {warehouses.map((warehouse) => (
                        <MenuItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {productId && fromWarehouseId && availableStock !== null && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      Available stock:{" "}
                      <strong>{availableStock.toLocaleString()} units</strong>
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="transfer-to-warehouse-label">To Warehouse</InputLabel>
                    <Select
                      value={toWarehouseId}
                      onChange={(e) => setToWarehouseId(e.target.value)}
                      label="To Warehouse"
                      labelId="transfer-to-warehouse-label"
                      disabled={!fromWarehouseId}
                    >
                      {warehouses
                        .filter((w) => w.id !== parseInt(fromWarehouseId))
                        .map((warehouse) => (
                          <MenuItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} ({warehouse.code})
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Quantity"
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || (!isNaN(val) && parseInt(val) > 0)) {
                        setQuantity(val);
                      }
                    }}
                    inputProps={{ min: 1, step: 1, inputMode: "numeric" }}
                    error={
                      quantity !== "" &&
                      (parseInt(quantity) <= 0 ||
                        !Number.isInteger(parseFloat(quantity)) ||
                        (availableStock !== null &&
                          parseInt(quantity) > availableStock))
                    }
                    helperText={
                      quantity !== "" &&
                      availableStock !== null &&
                      parseInt(quantity) > availableStock
                        ? `Exceeds available stock (${availableStock})`
                        : quantity !== "" &&
                          (parseInt(quantity) <= 0 ||
                            !Number.isInteger(parseFloat(quantity)))
                        ? "Must be a positive integer"
                        : "Must be a positive integer"
                    }
                    FormHelperTextProps={{
                      id: "quantity-helper-text",
                      role: quantity !== "" &&
                        (parseInt(quantity) <= 0 ||
                          !Number.isInteger(parseFloat(quantity)) ||
                          (availableStock !== null &&
                            parseInt(quantity) > availableStock))
                        ? "alert"
                        : undefined,
                    }}
                    aria-describedby="quantity-helper-text"
                    id="transfer-quantity"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    multiline
                    rows={2}
                    placeholder="Add a note about this transfer..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: { xs: "stretch", sm: "flex-end" },
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 2,
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setProductId("");
                        setFromWarehouseId("");
                        setToWarehouseId("");
                        setQuantity("");
                        setNote("");
                      }}
                      disabled={submitting}
                      fullWidth={isMobile}
                    >
                      Clear
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={!isFormValid || submitting}
                      startIcon={
                        submitting ? (
                          <CircularProgress size={16} />
                        ) : (
                          <SendIcon />
                        )
                      }
                      fullWidth={isMobile}
                    >
                      {submitting ? "Processing..." : "Execute Transfer"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          )}
        </DashboardCard>

        {/* Transfer History */}
        <DashboardCard
          title="Transfer History"
          subtitle="View all stock transfers with filtering and pagination"
          action={
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                flexWrap: "wrap",
                alignItems: { xs: "stretch", sm: "center" },
                flexDirection: { xs: "column", sm: "row" },
                width: "100%",
              }}
            >
              {isMobile ? (
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={
                      exporting ? (
                        <CircularProgress size={16} />
                      ) : (
                        <MoreVertIcon />
                      )
                    }
                    onClick={handleExportMenuOpen}
                    disabled={exporting || filteredTransfers.length === 0}
                    fullWidth
                  >
                    Export
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={
                    exporting ? (
                      <CircularProgress size={16} />
                    ) : (
                      <FileDownloadIcon />
                    )
                  }
                  endIcon={<ArrowDropDownIcon />}
                  onClick={handleExportMenuOpen}
                  disabled={exporting || filteredTransfers.length === 0}
                >
                  Export
                </Button>
              )}
              <Menu
                anchorEl={exportMenuAnchor}
                open={Boolean(exportMenuAnchor)}
                onClose={handleExportMenuClose}
              >
                <MenuItem
                  onClick={handleExportCsv}
                  disabled={exporting || filteredTransfers.length === 0}
                >
                  Export CSV
                </MenuItem>
                <MenuItem
                  onClick={handleExportPdf}
                  disabled={exporting || filteredTransfers.length === 0}
                >
                  Export PDF
                </MenuItem>
              </Menu>
              <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
                <InputLabel id="filter-warehouse-label">Filter by Warehouse</InputLabel>
                <Select
                  value={filterWarehouseId}
                  onChange={(e) => {
                    setFilterWarehouseId(e.target.value);
                    setPage(0);
                  }}
                  label="Filter by Warehouse"
                  labelId="filter-warehouse-label"
                >
                  <MenuItem value="all">All Warehouses</MenuItem>
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
                <InputLabel id="filter-product-label">Filter by Product</InputLabel>
                <Select
                  value={filterProductId}
                  onChange={(e) => {
                    setFilterProductId(e.target.value);
                    setPage(0);
                  }}
                  label="Filter by Product"
                  labelId="filter-product-label"
                >
                  <MenuItem value="all">All Products</MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          }
        >
          {loading ? (
            <>
              <Box sx={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }} aria-live="polite" aria-atomic="true">
                Loading transfer history...
              </Box>
              <Box sx={{ mt: 2 }}>
                <Skeleton variant="rectangular" height={400} aria-hidden="true" />
              </Box>
            </>
          ) : filteredTransfers.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              {filterWarehouseId !== "all" || filterProductId !== "all"
                ? "No transfers match your filters."
                : "No transfers recorded yet. Create your first transfer above."}
            </Alert>
          ) : (
            <>
              {isMobile ? (
                <Box sx={{ mt: 2, display: "grid", gap: 2 }}>
                  {paginatedTransfers.map((transfer) => (
                    <Paper key={transfer.id} sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {transfer.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(transfer.createdAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                      <Box
                        sx={{
                          mt: 1.5,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {transfer.fromWarehouseName}
                        </Typography>
                        <SwapHorizIcon sx={{ fontSize: 18, color: "primary.main" }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {transfer.toWarehouseName}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          mt: 1.5,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Quantity
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {transfer.quantity.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Status
                        </Typography>
                        <Chip
                          label={transfer.status}
                          color={
                            transfer.status === "completed" ? "success" : "error"
                          }
                          size="small"
                          variant="outlined"
                          aria-label={`Transfer status: ${transfer.status}`}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {transfer.note || "No note provided."}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <TableContainer sx={{ mt: 2 }}>
                  <Table aria-label="Stock transfers history table">
                    <TableHead>
                      <TableRow>
                        <TableCell component="th" scope="col">Date/Time</TableCell>
                        <TableCell component="th" scope="col">Product</TableCell>
                        <TableCell component="th" scope="col">Transfer</TableCell>
                        <TableCell component="th" scope="col" align="right">Quantity</TableCell>
                        <TableCell component="th" scope="col" align="center">Status</TableCell>
                        <TableCell component="th" scope="col">Note</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedTransfers.map((transfer) => (
                        <TableRow key={transfer.id} hover>
                          <TableCell>
                            {new Date(transfer.createdAt).toLocaleString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {transfer.productName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {transfer.productId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography variant="body2" color="text.secondary">
                                {transfer.fromWarehouseName}
                              </Typography>
                              <SwapHorizIcon
                                sx={{ fontSize: 18, color: "primary.main" }}
                              />
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {transfer.toWarehouseName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {transfer.quantity.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={transfer.status}
                              color={
                                transfer.status === "completed"
                                  ? "success"
                                  : "error"
                              }
                              size="small"
                              variant="outlined"
                              aria-label={`Transfer status: ${transfer.status}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {transfer.note || "-"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <TablePagination
                component="div"
                count={filteredTransfers.length}
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
