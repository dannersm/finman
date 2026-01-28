
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'bson';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { categoryId } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    if (typeof categoryId === 'undefined') {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const transactionsCollection = db.collection('transactions');

    const result = await transactionsCollection.updateOne(
      { _id: ObjectId.createFromHexString(id) },
      { $set: { category: categoryId, isManualCategory: true } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Transaction updated successfully' }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to update transaction' }, { status: 500 });
  }
}
