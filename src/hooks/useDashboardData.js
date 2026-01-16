import { useState, useEffect, useCallback } from "react";

export function useDashboardData() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const [productsRes, warehousesRes, stockRes] = await Promise.all([
        fetch("/api/products", { signal }),
        fetch("/api/warehouses", { signal }),
        fetch("/api/stock", { signal }),
      ]);

      if (!productsRes.ok || !warehousesRes.ok || !stockRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [productsData, warehousesData, stockData] = await Promise.all([
        productsRes.json(),
        warehousesRes.json(),
        stockRes.json(),
      ]);

      if (!signal.aborted) {
        setProducts(productsData);
        setWarehouses(warehousesData);
        setStock(stockData);
        setLastUpdated(new Date());
        setLoading(false);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // Request was aborted, ignore
        return;
      }
      if (!signal.aborted) {
        setError(err.message || "Failed to load dashboard data");
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    fetchData(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    const abortController = new AbortController();
    fetchData(abortController.signal);
  }, [fetchData]);

  return {
    products,
    warehouses,
    stock,
    loading,
    error,
    lastUpdated,
    refresh,
  };
}
