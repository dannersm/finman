'use client';
import { useState, memo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';
import { useUpdateTransactionCategory } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';

function ChangeCategoryModal({
  open,
  onClose,
  transaction
}) {
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: categories = [] } = useCategories();
  const updateCategoryMutation = useUpdateTransactionCategory();

  useEffect(() => {
    if (transaction) {
      setSelectedCategory(transaction.category || '');
    }
  }, [transaction]);

  const handleConfirm = async () => {
    try {
      await updateCategoryMutation.mutateAsync({
        transactionId: transaction.id,
        categoryId: selectedCategory
      });
      onClose();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleClose = () => {
    setSelectedCategory(transaction?.category || '');
    onClose();
  };

  if (!transaction) return null;

  const isPending = updateCategoryMutation.isPending;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Cambiar Categoría
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {transaction.description}
        </Typography>
        <FormControl fullWidth sx={{ mt: 1 }}>
          <InputLabel>Categoría</InputLabel>
          <Select
            value={selectedCategory}
            label="Categoría"
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={isPending}
          >
            <MenuItem value="">
              <em>Sin categoría</em>
            </MenuItem>
            {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map((category) => (
              <MenuItem key={category._id} value={category._id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={isPending}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm} variant="contained" disabled={isPending}>
          {isPending ? 'Cambiando...' : 'Cambiar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default memo(ChangeCategoryModal);