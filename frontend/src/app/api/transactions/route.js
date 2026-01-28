
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const transactionsCollection = db.collection('transactions');

    let transactions = await transactionsCollection.find({}).toArray();

    const transactionsWithId = transactions.map(t => {
        const { _id, ...rest } = t;
        return { ...rest, id: _id.toString() };
    });

    return NextResponse.json(transactionsWithId);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to fetch transactions' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const transactionsCollection = db.collection('transactions');

    const result = await transactionsCollection.deleteOne({ _id: ObjectId.createFromHexString(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to delete transaction' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const transactionsCollection = db.collection('transactions');

    const body = await request.json();
    const { description, amount, date, category } = body;

    if (!description || !amount || !date) {
      return NextResponse.json({ error: 'Description, amount, and date are required' }, { status: 400 });
    }

    const newTransaction = {
      description,
      amount: parseFloat(amount),
      date: new Date(date),
      category: category || null,
    };

    const result = await transactionsCollection.insertOne(newTransaction);
    const insertedId = result.insertedId;

    const createdTransaction = {
      ...newTransaction,
      id: insertedId.toString(),
    };
    delete createdTransaction._id;

    return NextResponse.json(createdTransaction, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to create transaction' }, { status: 500 });
  }
}
