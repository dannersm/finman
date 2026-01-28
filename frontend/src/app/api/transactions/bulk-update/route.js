import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { classifyTransactions } from '@/lib/classification';

export async function POST(request) {
  try {
    const { categories, scope } = await request.json();

    if (!categories || !scope) {
      return NextResponse.json({ error: 'Categories and scope are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const transactionsCollection = db.collection('transactions');

    let transactionsToUpdate = [];
    if (scope === 'uncategorized') {
      transactionsToUpdate = await transactionsCollection.find({ category: { $in: [null, undefined] } }).toArray();
    } else if (scope === 'all-non-manual') {
      transactionsToUpdate = await transactionsCollection.find({ isManualCategory: { $ne: true } }).toArray();
    } else if (scope === 'all') {
      transactionsToUpdate = await transactionsCollection.find({}).toArray();
    } else {
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
    }

    const classifiedTransactions = classifyTransactions(transactionsToUpdate, categories);

    const bulkOps = classifiedTransactions.map(transaction => {
      return {
        updateOne: {
          filter: { _id: transaction._id },
          update: { $set: { category: transaction.category, isManualCategory: false } }
        }
      };
    });

    if (bulkOps.length > 0) {
      await transactionsCollection.bulkWrite(bulkOps);
    }

    return NextResponse.json({ message: 'Transactions updated successfully' }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to update transactions' }, { status: 500 });
  }
}
