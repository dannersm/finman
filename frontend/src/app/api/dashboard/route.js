import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch transactions and categories in parallel
    const [transactions, categories] = await Promise.all([
      db.collection('transactions').find({}).sort({ date: -1 }).toArray(),
      db.collection('categories').find({}).sort({ name: 1 }).toArray()
    ]);

    // Convert MongoDB _id to string and keep as _id
    const formattedTransactions = transactions.map(transaction => ({
      ...transaction,
      _id: transaction._id.toString(),
      id: transaction._id.toString(),
    }));

    const formattedCategories = categories.map(category => ({
      ...category,
      _id: category._id.toString(),
    }));

    // Calculate date range if not provided
    let dateRange = null;
    if (formattedTransactions.length > 0) {
      const dates = formattedTransactions.map(t => new Date(t.date));
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date();

      const startOfMonth = new Date();
      startOfMonth.setUTCDate(1);
      startOfMonth.setUTCHours(0, 0, 0, 0);

      dateRange = {
        minDate: minDate.getTime(),
        maxDate: maxDate.getTime(),
        defaultStart: startOfMonth.getTime(),
        defaultEnd: maxDate.getTime()
      };
    }

    // Filter transactions by date range if provided
    let filteredTransactions = formattedTransactions;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);

      const startTime = start.getTime();
      const endTime = end.getTime();

      filteredTransactions = formattedTransactions.filter(t => {
        const transactionDate = new Date(t.date).getTime();
        const isInDateRange = transactionDate >= startTime && transactionDate <= endTime;

        // Exclude transactions with reconciled categories
        const category = formattedCategories.find(cat => cat._id === t.category);
        const isReconciled = category?.reconcile || false;

        return isInDateRange && !isReconciled;
      });
    } else {
      // Filter out reconciled transactions when no date range is provided
      filteredTransactions = formattedTransactions.filter(t => {
        const category = formattedCategories.find(cat => cat._id === t.category);
        const isReconciled = category?.reconcile || false;
        return !isReconciled;
      });
    }

    return Response.json({
      transactions: formattedTransactions,
      categories: formattedCategories,
      filteredTransactions,
      dateRange
    });

  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return Response.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}