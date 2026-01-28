'use client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { Paper, Typography, Box, useTheme, useMediaQuery, CircularProgress } from '@mui/material';
import { summarizeByCategory } from '@/lib/classification';
import { formatCurrency, getResponsiveVariant, truncateText, getChartMargins } from '@/lib/utils';
import { useMemo, memo, useCallback } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';

function CategoryChart({ startDate, endDate }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data, isLoading: transactionsLoading } = useTransactions(startDate, endDate);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const chartData = useMemo(() => {
    const transactions = data?.filteredTransactions || [];
    return summarizeByCategory(transactions, categories);
  }, [data, categories]);

  const CustomizedYAxisTick = useCallback(({ x, y, payload }) => {
    const color = payload.value === 'Sin Categorizar' ? '#808080' : 'rgb(144, 202, 249)';
    const fontSize = isMobile ? 10 : 12;
    const text = isMobile ? truncateText(payload.value) : payload.value;

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={-10} y={0} dy={4} textAnchor="end" fill={color} fontSize={fontSize}>
          {text}
        </text>
      </g>
    );
  }, [isMobile]);

  const tooltipFormatter = useCallback((value) => formatCurrency(value), []);

  if (transactionsLoading || categoriesLoading) {
    return (
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant={getResponsiveVariant(isMobile)} gutterBottom>
        Gastos por Categoría
      </Typography>
      <Box sx={{ height: Math.max(250, 55 * chartData.length) }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartData.length > 0 ? (
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{
                ...getChartMargins(isMobile),
                left: isMobile ? 30 : 50
              }}
            >
              <XAxis type="number" stroke="#999" />
              <YAxis
                type="category"
                dataKey="name"
                tick={<CustomizedYAxisTick />}
                axisLine={{ stroke: '#999' }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                formatter={tooltipFormatter}
              />
              <Bar dataKey="total" name="Total Gastado">
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === 'Sin Categorizar' ? '#808080' : 'rgb(144, 202, 249)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body1" color="text.secondary">
                No hay datos de gastos para mostrar.
              </Typography>
            </Box>
          )}
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

export default memo(CategoryChart);
