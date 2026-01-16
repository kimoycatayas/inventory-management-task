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
  AppBar,
  Toolbar,
  Box,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import InventoryIcon from "@mui/icons-material/Inventory";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { exportToCsv } from "@/lib/exportCsv";
import { exportToPdf } from "@/lib/exportPdf";

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = () => {
    fetch("/api/warehouses")
      .then((res) => res.json())
      .then((data) => setWarehouses(data));
  };

  const handleClickOpen = (id) => {
    setSelectedWarehouseId(id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedWarehouseId(null);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/warehouses/${selectedWarehouseId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setWarehouses(
          warehouses.filter((warehouse) => warehouse.id !== selectedWarehouseId)
        );
        handleClose();
      }
    } catch (error) {
      console.error("Error deleting warehouse:", error);
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
      { id: "code", label: "Code" },
      { id: "name", label: "Name" },
      { id: "location", label: "Location" },
    ];

    const rows = warehouses.map((warehouse) => ({
      code: warehouse.code,
      name: warehouse.name,
      location: warehouse.location,
    }));

    return { columns, rows };
  };

  const handleExportCsv = () => {
    if (warehouses.length === 0) {
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
        filename: "warehouses",
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
    if (warehouses.length === 0) {
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
        title: "Warehouses Report",
        subtitle: `Generated on ${new Date().toLocaleDateString()}`,
        columns,
        rows,
        filename: "warehouses",
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
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            Warehouses
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
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
              disabled={exporting || warehouses.length === 0}
            >
              Export
            </Button>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={handleExportMenuClose}
            >
              <MenuItem
                onClick={handleExportCsv}
                disabled={exporting || warehouses.length === 0}
              >
                Export CSV
              </MenuItem>
              <MenuItem
                onClick={handleExportPdf}
                disabled={exporting || warehouses.length === 0}
              >
                Export PDF
              </MenuItem>
            </Menu>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              href="/warehouses/add"
            >
              Add Warehouse
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table aria-label="Warehouses table">
            <TableHead>
              <TableRow>
                <TableCell component="th" scope="col">
                  <strong>Code</strong>
                </TableCell>
                <TableCell component="th" scope="col">
                  <strong>Name</strong>
                </TableCell>
                <TableCell component="th" scope="col">
                  <strong>Location</strong>
                </TableCell>
                <TableCell component="th" scope="col">
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {warehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell>{warehouse.code}</TableCell>
                  <TableCell>{warehouse.name}</TableCell>
                  <TableCell>{warehouse.location}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      component={Link}
                      href={`/warehouses/edit/${warehouse.id}`}
                      size="small"
                      aria-label={`Edit warehouse ${warehouse.name}`}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleClickOpen(warehouse.id)}
                      size="small"
                      aria-label={`Delete warehouse ${warehouse.name}`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {warehouses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No warehouses available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="delete-warehouse-dialog-title"
          aria-describedby="delete-warehouse-dialog-description"
        >
          <DialogTitle id="delete-warehouse-dialog-title">
            Delete Warehouse
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-warehouse-dialog-description">
              Are you sure you want to delete this warehouse? This action cannot
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
