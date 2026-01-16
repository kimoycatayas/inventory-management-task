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

export default function Products() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  };

  const handleClickOpen = (id) => {
    setSelectedProductId(id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProductId(null);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/products/${selectedProductId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts(
          products.filter((product) => product.id !== selectedProductId)
        );
        handleClose();
      }
    } catch (error) {
      console.error("Error deleting product:", error);
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
      { id: "sku", label: "SKU" },
      { id: "name", label: "Name" },
      { id: "category", label: "Category" },
      { id: "unitCost", label: "Unit Cost" },
      { id: "reorderPoint", label: "Reorder Point" },
    ];

    const rows = products.map((product) => ({
      sku: product.sku,
      name: product.name,
      category: product.category,
      unitCost: product.unitCost,
      reorderPoint: product.reorderPoint,
    }));

    return { columns, rows };
  };

  const handleExportCsv = () => {
    if (products.length === 0) {
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
        filename: "products",
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
    if (products.length === 0) {
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
        title: "Products Report",
        subtitle: `Generated on ${new Date().toLocaleDateString()}`,
        columns,
        rows,
        filename: "products",
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
            Products
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
                  disabled={exporting || products.length === 0}
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
                disabled={exporting || products.length === 0}
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
                disabled={exporting || products.length === 0}
              >
                Export CSV
              </MenuItem>
              <MenuItem
                onClick={handleExportPdf}
                disabled={exporting || products.length === 0}
              >
                Export PDF
              </MenuItem>
            </Menu>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              href="/products/add"
              fullWidth={isMobile}
            >
              Add Product
            </Button>
          </Box>
        </Box>

        {isMobile ? (
          <Box sx={{ display: "grid", gap: 2 }}>
            {products.map((product) => (
              <Paper key={product.id} sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {product.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {product.sku} • {product.category}
                </Typography>
                <Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Unit cost
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {product.unitCost != null
                        ? `$${product.unitCost.toFixed(2)}`
                        : "N/A"}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Reorder point
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {product.reorderPoint}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
                  <Button
                    variant="outlined"
                    component={Link}
                    href={`/products/edit/${product.id}`}
                    fullWidth
                  >
                    Edit
                  </Button>
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => handleClickOpen(product.id)}
                    fullWidth
                  >
                    Delete
                  </Button>
                </Box>
              </Paper>
            ))}
            {products.length === 0 && (
              <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2">No products available.</Typography>
              </Paper>
            )}
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table aria-label="Products table">
              <TableHead>
                <TableRow>
                  <TableCell component="th" scope="col">
                    <strong>SKU</strong>
                  </TableCell>
                  <TableCell component="th" scope="col">
                    <strong>Name</strong>
                  </TableCell>
                  <TableCell component="th" scope="col">
                    <strong>Category</strong>
                  </TableCell>
                  <TableCell component="th" scope="col" align="right">
                    <strong>Unit Cost</strong>
                  </TableCell>
                  <TableCell component="th" scope="col" align="right">
                    <strong>Reorder Point</strong>
                  </TableCell>
                  <TableCell component="th" scope="col">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell align="right">
                      {product.unitCost != null
                        ? `$${product.unitCost.toFixed(2)}`
                        : "N/A"}
                    </TableCell>
                    <TableCell align="right">{product.reorderPoint}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        component={Link}
                        href={`/products/edit/${product.id}`}
                        size="small"
                        aria-label={`Edit product ${product.name}`}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleClickOpen(product.id)}
                        size="small"
                        aria-label={`Delete product ${product.name}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No products available.
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
          aria-labelledby="delete-product-dialog-title"
          aria-describedby="delete-product-dialog-description"
        >
          <DialogTitle id="delete-product-dialog-title">Delete Product</DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-product-dialog-description">
              Are you sure you want to delete this product? This action cannot
              be undone.
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
