'use client';
import { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale/es';
import { useAddTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', md: 400 },
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function AddTransactionModal({ open, onClose }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [category, setCategory] = useState('');

  const { data: categories = [] } = useCategories();
  const addTransactionMutation = useAddTransaction();

  const handleSave = async () => {
    if (!description || !amount || !date) {
      return;
    }
    
    try {
      await addTransactionMutation.mutateAsync({
        description,
        amount: parseFloat(amount),
        date,
        category: category || null
      });
      
      setDescription('');
      setAmount('');
      setDate(new Date());
      setCategory('');
      onClose();
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const isSubmitting = addTransactionMutation.isPending;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h2" sx={{ mb: 3 }}>
          Añadir Movimiento Manual
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <Stack spacing={2}>
            <TextField
              label="Descripción"
              variant="outlined"
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <TextField
              label="Monto"
              variant="outlined"
              fullWidth
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <DatePicker
              label="Fecha"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              disabled={isSubmitting}
            />
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={category}
                label="Categoría"
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
              >
                <MenuItem value="">
                  <em>Sin categoría</em>
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                onClick={handleSave} 
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button 
                variant="outlined" 
                onClick={onClose} 
                fullWidth
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </Stack>
          </Stack>
        </LocalizationProvider>
      </Box>
    </Modal>
  );
}
