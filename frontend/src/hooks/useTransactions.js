import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

const fetchDashboardData = async ({ startDate, endDate }) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());

  const response = await fetch(`/api/dashboard?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
};

const addTransaction = async (transaction) => {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  });
  if (!response.ok) {
    throw new Error('Failed to add transaction');
  }
  return response.json();
};

const deleteTransaction = async (id) => {
  const response = await fetch(`/api/transactions?id=${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete transaction');
  }
  return response.json();
};

const updateTransactionCategory = async ({ transactionId, categoryId }) => {
  const response = await fetch(`/api/transactions/${transactionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ categoryId }),
  });
  if (!response.ok) {
    throw new Error('Failed to update transaction category');
  }
  return response.json();
};

const bulkUpdateTransactions = async ({ categories, scope }) => {
  const response = await fetch('/api/transactions/bulk-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ categories, scope }),
  });
  if (!response.ok) {
    throw new Error('Failed to bulk update transactions');
  }
  return response.json();
};

const updateTransactions = async () => {
    const response = await fetch('/api/transactions/update', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to update transactions from source');
      }
      return response.json();
}

export const useTransactions = (startDate, endDate) => {
  return useQuery({
    queryKey: ['dashboard', { 
      startDate: startDate ? startDate.toISOString() : null, 
      endDate: endDate ? endDate.toISOString() : null 
    }],
    queryFn: () => fetchDashboardData({ startDate, endDate }),
    placeholderData: keepPreviousData,
  });
};

export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateTransactionCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTransactionCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useBulkUpdateTransactions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkUpdateTransactions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateTransactions = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: updateTransactions,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      },
    });
  };
