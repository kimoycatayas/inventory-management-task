import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { exportToCsv } from "@/lib/exportCsv";
import { exportToPdf } from "@/lib/exportPdf";

export default function Stock() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [stock, setStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    Promise.all([
      fetch("/api/stock").then((res) => res.json()),
      fetch("/api/products").then((res) => res.json()),
      fetch("/api/warehouses").then((res) => res.json()),
    ]).then(([stockData, productsData, warehousesData]) => {
      setStock(stockData);
      setProducts(productsData);
      setWarehouses(warehousesData);
    });
  };

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? `${product.name} (${product.sku})` : "Unknown";
  };

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    return warehouse ? `${warehouse.name} (${warehouse.code})` : "Unknown";
  };

  const handleClickOpen = (id) => {
    setSelectedStockId(id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStockId(null);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/stock/${selectedStockId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setStock(stock.filter((item) => item.id !== selectedStockId));
        handleClose();
      }
    } catch (error) {
      console.error("Error deleting stock:", error);
    }
  };

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const prepareExportData = () => {
    const columns = [
      { id: "product", label: "Product" },
      { id: "warehouse", label: "Warehouse" },
      { id: "quantity", label: "Quantity" },
    ];

    const rows = stock.map((item) => ({
      product: getProductName(item.productId),
      warehouse: getWarehouseName(item.warehouseId),
      quantity: item.quantity,
    }));

    return { columns, rows };
  };

  const handleExportCsv = () => {
    if (stock.length === 0) {
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
        filename: "stock-levels",
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
    if (stock.length === 0) {
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
        title: "Stock Levels Report",
        subtitle: `Generated on ${new Date().toLocaleDateString()}`,
        columns,
        rows,
        filename: "stock-levels",
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

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            mb: 3,
            gap: 2,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontSize: { xs: 22, sm: 28, md: 34 } }}
          >
            Stock Levels
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {isMobile ? (
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <IconButton
                  onClick={handleExportMenuOpen}
                  disabled={exporting || stock.length === 0}
                  aria-label="Open export options"
                >
                  {exporting ? <CircularProgress size={20} /> : <MoreVertIcon />}
                </IconButton>
              </Box>
            ) : (
              <Button
                variant="outlined"
                startIcon={
                  exporting ? (
                    <CircularProgress size={16} />
                  ) : (
                    <FileDownloadIcon />
                  )
                }
                endIcon={<ArrowDropDownIcon />}
                onClick={handleExportMenuOpen}
                disabled={exporting || stock.length === 0}
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
                disabled={exporting || stock.length === 0}
              >
                Export CSV
              </MenuItem>
              <MenuItem
                onClick={handleExportPdf}
                disabled={exporting || stock.length === 0}
              >
                Export PDF
              </MenuItem>
            </Menu>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              href="/stock/add"
              fullWidth={isMobile}
            >
              Add Stock Record
            </Button>
          </Box>
        </Box>

        {isMobile ? (
          <Box sx={{ display: "grid", gap: 2 }}>
            {stock.map((item) => (
              <Paper key={item.id} sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {getProductName(item.productId)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getWarehouseName(item.warehouseId)}
                </Typography>
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
                    {item.quantity}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
                  <Button
                    variant="outlined"
                    component={Link}
                    href={`/stock/edit/${item.id}`}
                    fullWidth
                  >
                    Edit
                  </Button>
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => handleClickOpen(item.id)}
                    fullWidth
                  >
                    Delete
                  </Button>
                </Box>
              </Paper>
            ))}
            {stock.length === 0 && (
              <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2">
                  No stock records available.
                </Typography>
              </Paper>
            )}
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table aria-label="Stock levels table">
              <TableHead>
                <TableRow>
                  <TableCell component="th" scope="col">
                    <strong>Product</strong>
                  </TableCell>
                  <TableCell component="th" scope="col">
                    <strong>Warehouse</strong>
                  </TableCell>
                  <TableCell component="th" scope="col" align="right">
                    <strong>Quantity</strong>
                  </TableCell>
                  <TableCell component="th" scope="col">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{getProductName(item.productId)}</TableCell>
                    <TableCell>{getWarehouseName(item.warehouseId)}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        component={Link}
                        href={`/stock/edit/${item.id}`}
                        size="small"
                        aria-label={`Edit stock record for ${getProductName(
                          item.productId
                        )}`}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleClickOpen(item.id)}
                        size="small"
                        aria-label={`Delete stock record for ${getProductName(
                          item.productId
                        )}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {stock.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No stock records available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog 
          open={open} 
          onClose={handleClose}
          aria-labelledby="delete-stock-dialog-title"
          aria-describedby="delete-stock-dialog-description"
        >
          <DialogTitle id="delete-stock-dialog-title">Delete Stock Record</DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-stock-dialog-description">
              Are you sure you want to delete this stock record? This action
              cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDelete} color="error" autoFocus>
              Delete
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
      </Container>
    </>
  );
}
