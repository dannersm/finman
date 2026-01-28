'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useAddCategory, useUpdateCategory } from '@/hooks/useCategories';

export default function CategoryModal({ open, onClose, category }) {
  const [name, setName] = useState('');
  const [matchTerms, setMatchTerms] = useState('');
  const [avoidTerms, setAvoidTerms] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [reconcile, setReconcile] = useState(false);

  const addCategoryMutation = useAddCategory();
  const updateCategoryMutation = useUpdateCategory();

  useEffect(() => {
    if (category) {
      setName(category.name);
      setMatchTerms(category.matchTerms.join(', '));
      setAvoidTerms(category.avoidTerms ? category.avoidTerms.join(', ') : '');
      setMinAmount(category.minAmount || '');
      setMaxAmount(category.maxAmount || '');
      setReconcile(category.reconcile || false);
    } else {
      setName('');
      setMatchTerms('');
      setAvoidTerms('');
      setMinAmount('');
      setMaxAmount('');
      setReconcile(false);
    }
  }, [category, open]);

  const handleSave = async () => {
    const categoryData = {
      name,
      matchTerms: matchTerms.split(',').map(t => t.trim()).filter(Boolean),
      avoidTerms: avoidTerms.split(',').map(t => t.trim()).filter(Boolean),
      minAmount: minAmount ? parseFloat(minAmount) : null,
      maxAmount: maxAmount ? parseFloat(maxAmount) : null,
      reconcile,
    };

    try {
      if (category?._id) {
        await updateCategoryMutation.mutateAsync({ id: category._id, ...categoryData });
      } else {
        await addCategoryMutation.mutateAsync(categoryData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const isPending = addCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{category ? 'Editar Categoría' : 'Crear Nueva Categoría'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Nombre de la Categoría"
          type="text"
          fullWidth
          variant="standard"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
        />
        <TextField
          margin="dense"
          label="Términos a Incluir (separados por coma)"
          type="text"
          fullWidth
          variant="standard"
          value={matchTerms}
          onChange={(e) => setMatchTerms(e.target.value)}
          disabled={isPending}
        />
        <TextField
          margin="dense"
          label="Términos a Evitar (separados por coma)"
          type="text"
          fullWidth
          variant="standard"
          value={avoidTerms}
          onChange={(e) => setAvoidTerms(e.target.value)}
          disabled={isPending}
        />
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <TextField
            margin="dense"
            label="Monto Mínimo (Opcional)"
            type="number"
            fullWidth
            variant="standard"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            disabled={isPending}
          />
          <TextField
            margin="dense"
            label="Monto Máximo (Opcional)"
            type="number"
            fullWidth
            variant="standard"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            disabled={isPending}
          />
        </Stack>
        <FormControlLabel
          control={
            <Switch
              checked={reconcile}
              onChange={(e) => setReconcile(e.target.checked)}
              disabled={isPending}
            />
          }
          label="Categoría de Conciliación (excluir de análisis)"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>Cancelar</Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
