'use client';
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import { formatNumber } from '@/lib/formatNumber';
import { useMemo, memo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';

function TotalCard({ startDate, endDate }) {
  const { data, isLoading } = useTransactions(startDate, endDate);
  const total = useMemo(() => {
    const transactions = data?.filteredTransactions || [];
    return transactions.reduce((sum, transaction) => {
      // Only sum positive amounts (expenses), like the charts do
      return transaction.amount > 0 ? sum + transaction.amount : sum;
    }, 0);
  }, [data]);

  if (isLoading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center' }}>
            <Skeleton variant="text" width="60%" sx={{ mx: 'auto' }} />
            <Skeleton variant="text" width="40%" height={60} sx={{ mx: 'auto' }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" component="div" gutterBottom>
            Total del Período
          </Typography>
          <Typography variant="h4" component="div" color="primary">
            ${formatNumber(total)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default memo(TotalCard);
