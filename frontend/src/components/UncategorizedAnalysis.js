'use client';
import { useState, useMemo, memo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TableSortLabel,
  Switch,
  Box,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import { groupTransactionsByDescription } from '@/lib/classification';
import { formatCurrency } from '@/lib/utils';
import { useTransactions } from '@/hooks/useTransactions';

function UncategorizedAnalysis({ startDate, endDate }) {
  const [sortKey, setSortKey] = useState('count');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading } = useTransactions(startDate, endDate);
  const grouped = useMemo(() => {
    const transactions = data?.filteredTransactions || [];
    const dataToShow = showAll ? transactions : transactions.filter(t => !t.category);
    return groupTransactionsByDescription(dataToShow);
  }, [data, showAll]);

  const handleSortRequest = useCallback((key) => {
    const isAsc = sortKey === key && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortKey(key);
  }, [sortKey, sortDirection]);

  const handleShowAllToggle = useCallback((e) => {
    setShowAll(e.target.checked);
  }, []);

  const sortedData = useMemo(() => 
    [...grouped].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }),
    [grouped, sortKey, sortDirection]
  );

  if (isLoading) {
    return (
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" gutterBottom>
          {showAll ? 'Análisis de Todos los Movimientos' : 'Análisis de Movimientos Sin Categoría'}
        </Typography>
        <FormControlLabel
          control={<Switch checked={showAll} onChange={handleShowAllToggle} />}
          label="Mostrar Todos"
        />
      </Box>
      <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small" aria-label="grouped analysis table">
          <TableHead>
            <TableRow>
              <TableCell sortDirection={false}>Descripción</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortKey === 'count'}
                  direction={sortKey === 'count' ? sortDirection : 'asc'}
                  onClick={() => handleSortRequest('count')}
                >
                  Cantidad
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortKey === 'totalAmount'}
                  direction={sortKey === 'totalAmount' ? sortDirection : 'asc'}
                  onClick={() => handleSortRequest('totalAmount')}
                >
                  Suma Total
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((row) => (
              <TableRow key={row.description}>
                <TableCell>{row.description}</TableCell>
                <TableCell align="right">{row.count}</TableCell>
                <TableCell align="right">
                  {formatCurrency(row.totalAmount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default memo(UncategorizedAnalysis);
