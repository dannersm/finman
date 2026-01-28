'use client';
import { useState, useMemo, useEffect, memo, useCallback, useRef } from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Chip,
  MenuItem,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { summarizeMonthlyByCategory } from '@/lib/classification';
import { formatNumber } from '@/lib/formatNumber';
import { 
  formatCurrency, 
  formatMonthYear, 
  getResponsiveVariant, 
  getResponsiveSize,
  getChartMargins
} from '@/lib/utils';

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 224,
      width: 250,
    },
  },
};

function MonthlySpendChart({ startDate, endDate }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data, isLoading: transactionsLoading } = useTransactions(startDate, endDate);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const initializedRef = useRef(false);

  const allCategoryOptions = useMemo(() => [
    { _id: 'uncategorized', name: 'Sin Categorizar' },
    ...categories.filter(cat => !cat.reconcile).sort((a, b) => a.name.localeCompare(b.name)),
  ], [categories]);

  useEffect(() => {
    if (!categoriesLoading && !initializedRef.current && allCategoryOptions.length > 0) {
      setSelectedCategoryIds(allCategoryOptions.map(c => c._id));
      initializedRef.current = true;
    }
  }, [categoriesLoading, allCategoryOptions]);

  const chartData = useMemo(() => {
    const transactions = data?.transactions || [];
    return summarizeMonthlyByCategory(transactions, selectedCategoryIds, categories);
  }, [data, selectedCategoryIds, categories]);

  const handleChange = useCallback((event) => {
    const {
      target: { value },
    } = event;
    setSelectedCategoryIds(
      typeof value === 'string' ? value.split(',') : value,
    );
  }, []);

  const categoryMap = useMemo(() => {
    return allCategoryOptions.reduce((acc, cat) => {
      acc[cat._id] = cat.name;
      return acc;
    }, {});
  }, [allCategoryOptions]);

  const tooltipFormatter = useCallback((value) => [formatCurrency(value), 'Total Gastado'], []);

  if (transactionsLoading || categoriesLoading) {
    return (
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250, mb: 2 }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: { xs: 1, md: 2 }, mb: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', md: 'center' }, 
        mb: 2,
        gap: { xs: 2, md: 0 }
      }}>
        <Typography variant={getResponsiveVariant(isMobile)}>
          Gastos Mensuales
        </Typography>
        <FormControl sx={{ 
          m: { xs: 0, md: 1 }, 
          width: { xs: '100%', md: 300 },
          minWidth: { xs: 0, md: 250 }
        }}>
          <InputLabel id="category-select-label">Categorías</InputLabel>
          <Select
            labelId="category-select-label"
            multiple
            value={selectedCategoryIds}
            onChange={handleChange}
            input={<OutlinedInput id="select-multiple-chip" label="Categorías" />}
            size={getResponsiveSize(isMobile)}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.slice(0, 3).map((value) => (
                  <Chip key={value} label={categoryMap[value]} size="small" />
                ))}
                {selected.length > 3 && (
                  <Typography sx={{ alignSelf: 'center', fontSize: '0.8rem', ml: 0.5 }}>
                    +{selected.length - 3} más
                  </Typography>
                )}
              </Box>
            )}
            MenuProps={MenuProps}
          >
            {allCategoryOptions.map((category) => (
              <MenuItem
                key={category._id}
                value={category._id}
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                {category.name}
                <Button
                  size="small"
                  variant="text"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCategoryIds([category._id]);
                  }}
                  sx={{ 
                    minWidth: 'auto', 
                    ml: 2, 
                    fontSize: '0.7rem', 
                    p: '2px 5px',
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      color: 'primary.main',
                    }
                  }}
                >
                  ONLY
                </Button>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ height: { xs: 200, md: 250 } }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartData.length > 0 ? (
            <LineChart
              data={chartData}
              margin={getChartMargins(isMobile)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke={theme.palette.text.secondary} tickFormatter={formatMonthYear} />
              <YAxis
                stroke={theme.palette.text.secondary}
                tickFormatter={formatNumber}
              />
              <Tooltip
                formatter={tooltipFormatter}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="rgb(144, 202, 249)"
                strokeWidth={2}
                dot={{ r: 4, fill: 'rgb(144, 202, 249)' }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body1" color="text.secondary">
                No hay datos para las categorías seleccionadas.
              </Typography>
            </Box>
          )}
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

export default memo(MonthlySpendChart);
