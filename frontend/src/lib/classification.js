/**
 * Clasifica un conjunto de transacciones basado en una lista de categorías.
 *
 * @param {Array<Object>} transactions - La lista de transacciones a clasificar.
 * @param {Array<Object>} categories - La lista de categorías a usar para la clasificación.
 * @returns {Array<Object>} Una nueva lista de transacciones con la propiedad 'category' actualizada.
 */
export function classifyTransactions(transactions, categories) {
  return transactions.map(transaction => {
    if (transaction.isManualCategory) {
      return transaction;
    }

    let bestMatch = null;
    let longestMatchLength = 0;

    const description = transaction.description ? transaction.description.toLowerCase() : '';
    const amount = transaction.amount;

    categories.forEach(category => {
      // Amount checks
      if (category.minAmount && amount < category.minAmount) {
        return;
      }
      if (category.maxAmount && amount > category.maxAmount) {
        return;
      }

      // Avoid terms check
      const hasAvoidingTerm = category.avoidTerms && category.avoidTerms.some(term => term && description.includes(term.toLowerCase()));
      if (hasAvoidingTerm) {
        return;
      }

      // Match terms check
      if (category.matchTerms) {
        category.matchTerms.forEach(term => {
          if (term) {
            const lowerCaseTerm = term.toLowerCase();
            if (description.includes(lowerCaseTerm)) {
              if (lowerCaseTerm.length > longestMatchLength) {
                longestMatchLength = lowerCaseTerm.length;
                bestMatch = category._id;
              }
            }
          }
        });
      }
    });

    return { ...transaction, category: bestMatch };
  });
}

/**
 * Agrupa las transacciones por descripción y calcula la cuenta y la suma de los montos.
 *
 * @param {Array<Object>} transactions - La lista de transacciones.
 * @returns {Array<Object>} Una lista de objetos con { description, count, totalAmount }.
 */
export function groupTransactionsByDescription(transactions) {
    if (!transactions || transactions.length === 0) {
        return [];
    }

    const grouped = transactions.reduce((acc, transaction) => {
        const { description, amount } = transaction;
        if (!acc[description]) {
            acc[description] = { description, count: 0, totalAmount: 0 };
        }
        acc[description].count++;
        acc[description].totalAmount += amount;
        return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.count - a.count || b.totalAmount - a.totalAmount);
}

/**
 * Summarizes total spending by category.
 *
 * @param {Array<Object>} transactions - The list of transactions.
 * @param {Array<Object>} categories - The list of categories.
 * @returns {Array<Object>} A list of objects with { name, total }, sorted by total descending.
 */
export function summarizeByCategory(transactions, categories) {
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat._id] = { name: cat.name, total: 0, reconcile: cat.reconcile };
    return acc;
  }, {});

  // Initialize a category for uncategorized transactions
  const uncategorized = { name: 'Sin Categorizar', total: 0 };

  transactions.forEach(t => {
    // Only sum positive amounts (expenses)
    if (t.amount > 0) {
      if (t.category && categoryMap[t.category]) {
        // Skip transactions with reconciled categories
        if (!categoryMap[t.category].reconcile) {
          categoryMap[t.category].total += t.amount;
        }
      } else {
        uncategorized.total += t.amount;
      }
    }
  });

  const summarizedData = Object.values(categoryMap).filter(c => c.total > 0);

  if (uncategorized.total > 0) {
    summarizedData.push(uncategorized);
  }

  return summarizedData.sort((a, b) => b.total - a.total);
}

/**
 * Summarizes total spending by month for selected categories over the last year.
 *
 * @param {Array<Object>} transactions - The list of transactions.
 * @param {Array<string>} selectedCategoryIds - The IDs of categories to include, plus 'uncategorized'.
 * @returns {Array<Object>} A list of objects with { month, total }, sorted by month ascending.
 */
export function summarizeMonthlyByCategory(transactions, selectedCategoryIds, categories = []) {
  const oneYearAgo = new Date();
  oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);
  oneYearAgo.setUTCDate(1);
  oneYearAgo.setUTCHours(0, 0, 0, 0);

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // Create a map for easy category lookup
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat._id] = cat;
    return acc;
  }, {});

  const monthlyTotals = {};

  transactions.forEach(t => {
    const transactionDate = new Date(t.date);
    if (transactionDate < oneYearAgo || t.amount <= 0) {
      return;
    }

    const year = transactionDate.getUTCFullYear();
    const monthNum = transactionDate.getUTCMonth() + 1; // getUTCMonth() is 0-indexed
    const month = `${year}-${String(monthNum).padStart(2, '0')}`;

    // Skip future months
    if (month > currentMonthKey) {
      return;
    }

    let categoryId = t.category || 'uncategorized';

    // Treat orphaned categories as uncategorized
    if (categoryId !== 'uncategorized' && !categoryMap[categoryId]) {
      categoryId = 'uncategorized';
    }

    if (!selectedCategoryIds.includes(categoryId)) {
      return;
    }

    // Skip transactions with reconciled categories
    if (categoryId !== 'uncategorized' && categoryMap[categoryId]?.reconcile) {
      return;
    }

    if (!monthlyTotals[month]) {
      monthlyTotals[month] = 0;
    }
    monthlyTotals[month] += t.amount;
  });

  return Object.entries(monthlyTotals)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
