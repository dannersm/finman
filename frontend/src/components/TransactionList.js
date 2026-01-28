'use client';
import { useState, useMemo, memo, useCallback, useRef, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel,
  Menu,
  MenuItem as MenuItemOption,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { formatCurrency, formatShortDate, getResponsiveSize } from '@/lib/utils';
import ChangeCategoryModal from './ChangeCategoryModal';
import AddTransactionModal from './AddTransactionModal';
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';

function TransactionList({ startDate, endDate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [addModalOpen, setAddModalOpen] = useState(false);

  const { data, isLoading, isError } = useTransactions(startDate, endDate);
  const { data: categories = [] } = useCategories();
  const deleteTransactionMutation = useDeleteTransaction();

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(25);
  const observerTarget = useRef(null);

  const handleSort = useCallback((key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig.key, sortConfig.direction]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCategoryFilterChange = useCallback((e) => {
    setCategoryFilter(e.target.value);
  }, []);

  const sortedTransactions = useMemo(() => {
    const transactions = data?.filteredTransactions || [];
    let filteredTransactions = [...transactions]
      .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (categoryFilter) {
      filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }

    return filteredTransactions.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, searchTerm, categoryFilter, sortConfig]);

  // Reset visible count when filters/sort change
  useEffect(() => {
    setVisibleCount(25);
  }, [searchTerm, categoryFilter, sortConfig, data]);

  const paginatedTransactions = useMemo(() => {
    return sortedTransactions.slice(0, visibleCount);
  }, [sortedTransactions, visibleCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < sortedTransactions.length) {
          setVisibleCount((prev) => Math.min(prev + 25, sortedTransactions.length));
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [visibleCount, sortedTransactions.length]);

  // State for options menu and modals
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [changeCategoryModalOpen, setChangeCategoryModalOpen] = useState(false);

  const handleMenuClick = useCallback((event, transaction) => {
    if (isMobile) {
      event.preventDefault();
      setMenuPosition({
        top: event.clientY,
        left: event.clientX,
      });
    } else {
      setAnchorEl(event.currentTarget);
    }
    setSelectedTransaction(transaction);
  }, [isMobile]);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setMenuPosition(null);
    setSelectedTransaction(null);
  }, []);

  const handleDeleteClick = useCallback(async () => {
    if (selectedTransaction) {
      try {
        await deleteTransactionMutation.mutateAsync(selectedTransaction.id);
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
    handleMenuClose();
  }, [selectedTransaction, deleteTransactionMutation, handleMenuClose]);

  const handleChangeCategoryClick = useCallback(() => {
    setChangeCategoryModalOpen(true);
    setAnchorEl(null);
  }, []);

  const handleCategoryModalClose = useCallback(() => {
    setChangeCategoryModalOpen(false);
    setSelectedTransaction(null);
  }, []);

  const renderCategoryChip = useCallback((transaction) => {
    if (!transaction.category) {
      return <Chip label="Sin categoría" size="small" variant="outlined" />;
    }
    const category = categories.find(c => c._id === transaction.category);
    return category ? (
      <Chip
        label={category.name}
        size="small"
        color="primary"
        sx={{ maxWidth: '100%' }}
      />
    ) : (
      <Chip label="Sin categoría" size="small" variant="outlined" />
    );
  }, [categories]);

  const MobileTransactionCard = memo(({ transaction }) => (
    <Card sx={{ mb: 1 }}>
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="body2" color="text.secondary">
              {formatShortDate(transaction.date)}
            </Typography>
            <IconButton
              onClick={(e) => handleMenuClick(e, transaction)}
              aria-label="options"
              size="small"
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {transaction.description}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderCategoryChip(transaction)}
            <Typography variant="h6" color="primary">
              {formatCurrency(transaction.amount)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  ));
  MobileTransactionCard.displayName = 'MobileTransactionCard';

  if (isLoading) {
    return (
      <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (isError) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography color="error">Error al cargar movimientos</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ 
      p: { xs: 1, md: 2 }, 
      display: 'flex', 
      flexDirection: 'column', 
      height: { xs: 'auto', md: 1050 },
      minHeight: { md: 600 },
      overflow: 'hidden'
    }}>
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={2} 
        sx={{ mb: 2 }} 
        alignItems={{ md: 'center' }}
      >
        <TextField
          fullWidth
          variant="outlined"
          label="Buscar por descripción"
          value={searchTerm}
          onChange={handleSearchChange}
          size={getResponsiveSize(isMobile)}
        />
        <FormControl fullWidth size={getResponsiveSize(isMobile)} sx={{ minWidth: { md: 200 } }}>
          <InputLabel>Filtrar por categoría</InputLabel>
          <Select
            value={categoryFilter}
            label="Filtrar por categoría"
            onChange={handleCategoryFilterChange}
          >
            <MenuItem value="">
              <em>Todas</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category._id} value={category._id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddModalOpen(true)}
          size={getResponsiveSize(isMobile)}
          sx={{ flexShrink: 0 }}
        >
          Añadir Movimiento
        </Button>
      </Stack>

      {isMobile ? (
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {paginatedTransactions.map((transaction) => (
            <MobileTransactionCard key={transaction.id} transaction={transaction} />
          ))}
           <div ref={observerTarget} style={{ height: '20px' }} />
        </Box>
      ) : (
        <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Table sx={{ minWidth: 650, tableLayout: 'fixed' }} aria-label="simple table" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sortDirection={sortConfig.key === 'date' ? sortConfig.direction : false}
                  sx={{ width: '100px' }}
                >
                  <TableSortLabel
                    active={sortConfig.key === 'date'}
                    direction={sortConfig.key === 'date' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('date')}
                  >
                    Fecha
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: 'auto' }}>Descripción</TableCell>
                <TableCell sx={{ width: '150px' }}>Categoría</TableCell>
                <TableCell
                  align="right"
                  sortDirection={sortConfig.key === 'amount' ? sortConfig.direction : false}
                  sx={{ width: '110px' }}
                >
                  <TableSortLabel
                    active={sortConfig.key === 'amount'}
                    direction={sortConfig.key === 'amount' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('amount')}
                  >
                    Monto
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ width: '50px' }}>
                  
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTransactions.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    height: 53
                  }}
                >
                  <TableCell component="th" scope="row">
                    {formatShortDate(row.date)}
                  </TableCell>
                  <TableCell sx={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>
                    {row.description}
                  </TableCell>
                  <TableCell>
                    {renderCategoryChip(row)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(row.amount)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuClick(e, row)}
                      aria-label="options"
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {/* Sentinel for infinite scroll */}
              <TableRow ref={observerTarget}>
                <TableCell colSpan={5} sx={{ border: 0, p: 0, height: '10px' }} />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Options Menu */}
      <Menu
        open={Boolean(anchorEl) || Boolean(menuPosition)}
        onClose={handleMenuClose}
        anchorEl={anchorEl}
        anchorReference={menuPosition ? 'anchorPosition' : 'anchorEl'}
        anchorPosition={menuPosition}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItemOption onClick={handleChangeCategoryClick}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Cambiar categoría
        </MenuItemOption>
        <MenuItemOption onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Eliminar movimiento
        </MenuItemOption>
      </Menu>

      {/* Change Category Modal */}
      <ChangeCategoryModal
        open={changeCategoryModalOpen}
        onClose={handleCategoryModalClose}
        transaction={selectedTransaction}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal 
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </Paper>
  );
}

export default memo(TransactionList);
