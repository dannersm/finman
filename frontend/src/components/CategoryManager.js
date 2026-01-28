'use client';
import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
  Stack,
  TextField,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryModal from './CategoryModal';
import ConfirmationModal from './ConfirmationModal';
import { formatCurrency } from '@/lib/utils';
import { useCategories, useDeleteCategory } from '@/hooks/useCategories';

const formatAmountRange = (min, max) => {
  if (min && max) return `Monto: ${formatCurrency(min)} - ${formatCurrency(max)}`;
  if (min) return `Monto: > ${formatCurrency(min)}`;
  if (max) return `Monto: < ${formatCurrency(max)}`;
  return null;
};

export default function CategoryManager({ onApplyCategories }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const { data: categories = [], isLoading, isError } = useCategories();
  const deleteCategoryMutation = useDeleteCategory();

  const handleOpenModal = (category = null) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = (categoryId) => {
    const category = categories.find(c => c._id === categoryId);
    setCategoryToDelete(category);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategoryMutation.mutateAsync(categoryToDelete._id);
    } catch (error) {
      console.error('Error deleting category:', error);
    }

    setConfirmDeleteOpen(false);
    setCategoryToDelete(null);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setCategoryToDelete(null);
  };

  const filteredCategories = useMemo(() => 
    categories
      .filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name)),
    [categories, searchTerm]
  );

  if (isLoading) {
    return (
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (isError) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography color="error">Error loading categories</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: { xs: 1, md: 2 }, height: "100%"}}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', md: 'center' },
        gap: { xs: 2, md: 0 },
        mb: 2
      }}>
        <Typography variant={{ xs: 'subtitle1', md: 'h6' }}>
          Gestor de Categorías
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button 
            variant="contained" 
            size={isMobile ? "medium" : "small"} 
            onClick={() => handleOpenModal()}
            fullWidth={isMobile}
          >
            Añadir
          </Button>
          <Button 
            variant="contained" 
            size={isMobile ? "medium" : "small"} 
            onClick={onApplyCategories}
            fullWidth={isMobile}
            color="secondary"
          >
            Aplicar Cambios
          </Button>
        </Stack>
      </Box>
      
      {/* Search Field */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Buscar por nombre de categoría"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size={isMobile ? "small" : "medium"}
        />
      </Box>
      
      <List dense sx={{ maxHeight: Math.max(400, 50*filteredCategories.length), overflow: 'auto' }}>
        {filteredCategories.map(category => (
          <ListItem
            key={category._id}
            secondaryAction={
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={() => handleOpenModal(category)}
                  size={isMobile ? "small" : "medium"}
                >
                  <EditIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDelete(category._id)}
                  size={isMobile ? "small" : "medium"}
                  color="error"
                  disabled={deleteCategoryMutation.isPending}
                >
                  <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
              </Stack>
            }
            sx={{ 
              pr: { xs: 12, md: 10 }, // More space for mobile touch targets
              py: { xs: 1, md: 0.5 }
            }}
          >
            <ListItemText
              primary={category.name}
              secondary={
                <>
                  <Typography component="span" variant="body2" color="text.primary">
                    {`Incluir: ${category.matchTerms.join(', ')}`}
                  </Typography>
                  {category.avoidTerms && category.avoidTerms.length > 0 &&
                    <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                      {`Evitar: ${category.avoidTerms.join(', ')}`}
                    </Typography>
                  }
                  {formatAmountRange(category.minAmount, category.maxAmount) &&
                    <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                      {formatAmountRange(category.minAmount, category.maxAmount)}
                    </Typography>
                  }
                </>
              }
            />
          </ListItem>
        ))}
      </List>
      <CategoryModal
        open={modalOpen}
        onClose={handleCloseModal}
        category={editingCategory}
      />
      <ConfirmationModal
        open={confirmDeleteOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar categoría"
        message={`¿Estás seguro de que quieres eliminar la categoría "${categoryToDelete?.name}"? Esta acción no se puede deshacer.`}
      />
    </Paper>
  );
}
