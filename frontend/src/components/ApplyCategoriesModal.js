'use client';
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useBulkUpdateTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';

export default function ApplyCategoriesModal({ open, onClose }) {
  const [scope, setScope] = React.useState('uncategorized');

  const { data: categories = [] } = useCategories();
  const bulkUpdateMutation = useBulkUpdateTransactions();

  const handleChange = (event) => {
    setScope(event.target.value);
  };

  const handleConfirm = async () => {
    try {
      await bulkUpdateMutation.mutateAsync({ categories, scope });
      onClose();
    } catch (error) {
      console.error('Error applying categories:', error);
    }
  };

  const isPending = bulkUpdateMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Apply Categories</DialogTitle>
      <DialogContent>
        <RadioGroup value={scope} onChange={handleChange}>
          <FormControlLabel value="uncategorized" control={<Radio />} label="Sólo Movimientos sin categorizar" disabled={isPending} />
          <FormControlLabel value="all-non-manual" control={<Radio />} label="Todos los Movs. excepto los manuales." disabled={isPending} />
          <FormControlLabel value="all" control={<Radio />} label="Todos los movimientos." disabled={isPending} />
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button onClick={handleConfirm} autoFocus disabled={isPending}>
          {isPending ? 'Aplicando...' : 'Aplicar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
