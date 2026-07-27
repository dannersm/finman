"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Container,
  Typography,
  Grid,
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale/es";
import { BarChart, Label, Cached, UploadFile } from "@mui/icons-material";

import TransactionList from "@/components/TransactionList";
import CategoryManager from "@/components/CategoryManager";
import UncategorizedAnalysis from "@/components/UncategorizedAnalysis";
import CategoryChart from "@/components/CategoryChart";
import MonthlySpendChart from "@/components/MonthlySpendChart";
import ApplyCategoriesModal from "@/components/ApplyCategoriesModal";
import TotalCard from "@/components/TotalCard";
import { useTransactions, useUpdateTransactions, useImportStatement } from "@/hooks/useTransactions";

export default function Home() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState("analytics");
  const [isApplyCategoriesModalOpen, setIsApplyCategoriesModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const fileInputRef = useRef(null);

  // Initial fetch to get default date range if not set
  const { data: initialData } = useTransactions(null, null);
  const updateTransactionsMutation = useUpdateTransactions();
  const importStatementMutation = useImportStatement();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Set initial dates from server default range
  useEffect(() => {
    if (initialData?.dateRange && !startDate && !endDate) {
      setStartDate(new Date(initialData.dateRange.defaultStart));
      setEndDate(new Date(initialData.dateRange.defaultEnd));
    }
  }, [initialData, startDate, endDate]);

  const handleApplyCategories = useCallback(() => {
    setIsApplyCategoriesModalOpen(true);
  }, []);

  const handleViewChange = useCallback((event, newView) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  }, []);

  const handleUpdateTransactions = useCallback(async () => {
    try {
      await updateTransactionsMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to update transactions:', error);
    }
  }, [updateTransactionsMutation]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const result = await importStatementMutation.mutateAsync(file);
      setFeedback({
        severity: "success",
        message: `${result.message}: ${result.inserted} movimientos importados (${result.deleted} reemplazados).`,
      });
    } catch (error) {
      setFeedback({ severity: "error", message: error.message });
    }
  }, [importStatementMutation]);

  const renderAnalyticsGrid = () => (
    <Grid container spacing={{ xs: 2, md: 4 }} alignItems="stretch">
      <Grid size={{xs: 12, md: 6}}>
        <Stack spacing={{ xs: 1, md: 2 }}>
          <TotalCard startDate={startDate} endDate={endDate} />
          <CategoryChart startDate={startDate} endDate={endDate} />
          <MonthlySpendChart startDate={startDate} endDate={endDate} />
        </Stack>
      </Grid>
      <Grid size={{xs: 12, md: 6}} sx={{ display: 'flex', flexDirection: 'column' }}>
        <Stack spacing={{ xs: 1, md: 2 }} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography 
              variant={{ xs: "h6", md: "h5" }} 
              component="h2" 
              gutterBottom
            >
              Historial de Movimientos
            </Typography>
            <TransactionList startDate={startDate} endDate={endDate} />
          </Box>
        </Stack>
      </Grid>
    </Grid>
  );

  const renderClassificationGrid = () => (
    <Grid container spacing={{ xs: 2, md: 4 }}>
      <Grid size={{xs: 12, md: 6}}>
        <CategoryManager onApplyCategories={handleApplyCategories} />
      </Grid>
      <Grid size={{xs: 12, md: 6}}>
        <UncategorizedAnalysis startDate={startDate} endDate={endDate} />
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: { xs: 2, md: 4 } }}>
        <Typography 
          variant={{ xs: "h5", md: "h4" }} 
          component="h1" 
          sx={{ textAlign: { xs: "center", md: "left" }, mb: 3 }}
        >
          FinMan
        </Typography>
        
        {/* Controls Section */}
        <Grid container spacing={2} alignItems="center">
          {/* Date Range */}
          <Grid size={{ xs: 12, md: 8 }}>
            {isClient && (
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <Box sx={{ p: { xs: 1, md: 2 } }}>
                  <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>
                    Rango de Fechas
                  </Typography>
                  <Stack 
                    direction={{ xs: "column", sm: "row" }} 
                    spacing={2} 
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <DatePicker
                      label="Desde"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      format="dd/MM/yyyy"
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          sx: { minWidth: { xs: "100%", sm: 120 } }
                        }
                      }}
                    />
                    <DatePicker
                      label="Hasta"
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      format="dd/MM/yyyy"
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          sx: { minWidth: { xs: "100%", sm: 120 } }
                        }
                      }}
                    />
                  </Stack>
                </Box>
              </LocalizationProvider>
            )}
          </Grid>
          
          {/* View Controls */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box 
              sx={{ 
                display: "flex", 
                justifyContent: { xs: "center", md: "flex-end" },
                alignItems: "center",
                gap: 1
              }}
            >
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewChange}
                aria-label="vista de la aplicación"
                size="small"
              >
                <ToggleButton value="analytics" aria-label="analytics">
                  <BarChart />
                </ToggleButton>
                <ToggleButton value="classification" aria-label="classification">
                  <Label />
                </ToggleButton>
              </ToggleButtonGroup>
              <IconButton
                onClick={handleUpdateTransactions}
                disabled={updateTransactionsMutation.isPending}
                size="small"
                aria-label="actualizar movimientos"
              >
                {updateTransactionsMutation.isPending ? <CircularProgress size={20} /> : <Cached />}
              </IconButton>
              <input
                type="file"
                accept="application/pdf"
                ref={fileInputRef}
                onChange={handleFileSelected}
                style={{ display: "none" }}
              />
              <IconButton
                onClick={handleImportClick}
                disabled={importStatementMutation.isPending}
                size="small"
                aria-label="importar cartola PDF"
              >
                {importStatementMutation.isPending ? <CircularProgress size={20} /> : <UploadFile />}
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Box>
      {viewMode === "analytics"
        ? renderAnalyticsGrid()
        : renderClassificationGrid()}
      <ApplyCategoriesModal
        open={isApplyCategoriesModalOpen}
        onClose={() => setIsApplyCategoriesModalOpen(false)}
      />
      <Snackbar
        open={!!feedback}
        autoHideDuration={6000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setFeedback(null)}
          severity={feedback?.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
