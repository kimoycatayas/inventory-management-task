import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  MenuItem,
  CircularProgress,
  Grid,
} from "@mui/material";

export default function EditStock() {
  const [stock, setStock] = useState({
    productId: "",
    warehouseId: "",
    quantity: "",
  });
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      Promise.all([
        fetch(`/api/stock/${id}`).then((res) => res.json()),
        fetch("/api/products").then((res) => res.json()),
        fetch("/api/warehouses").then((res) => res.json()),
      ]).then(([stockData, productsData, warehousesData]) => {
        setStock(stockData);
        setProducts(productsData);
        setWarehouses(warehousesData);
        setLoading(false);
      });
    }
  }, [id]);

  const handleChange = (e) => {
    setStock({ ...stock, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/stock/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: parseInt(stock.productId),
        warehouseId: parseInt(stock.warehouseId),
        quantity: parseInt(stock.quantity),
      }),
    });
    if (res.ok) {
      router.push("/stock");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontSize: { xs: 22, sm: 28, md: 34 } }}
          >
            Edit Stock Record
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 2 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  select
                  label="Product"
                  name="productId"
                  value={stock.productId}
                  onChange={handleChange}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  select
                  label="Warehouse"
                  name="warehouseId"
                  value={stock.warehouseId}
                  onChange={handleChange}
                >
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Quantity"
                  name="quantity"
                  type="number"
                  inputProps={{ min: "0", inputMode: "numeric" }}
                  value={stock.quantity}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
            <Box
              sx={{
                mt: 3,
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
              >
                Update Stock
              </Button>
              <Button
                fullWidth
                variant="outlined"
                component={Link}
                href="/stock"
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
