
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const categoriesCollection = db.collection('categories');
    const categories = await categoriesCollection.find({}).sort({ name: 1 }).toArray();
    return NextResponse.json(categories);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const categoriesCollection = db.collection('categories');

    const body = await request.json();
    const { name, matchTerms, avoidTerms, minAmount, maxAmount, reconcile } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const newCategory = {
      name,
      matchTerms: matchTerms || [],
      avoidTerms: avoidTerms || [],
      minAmount: minAmount || null,
      maxAmount: maxAmount || null,
      reconcile: reconcile || false,
    };

    const result = await categoriesCollection.insertOne(newCategory);
    const insertedId = result.insertedId;

    const createdCategory = {
      ...newCategory,
      _id: insertedId.toString(),
    };

    return NextResponse.json(createdCategory, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to create category' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const categoriesCollection = db.collection('categories');

    const result = await categoriesCollection.deleteOne({ _id: ObjectId.createFromHexString(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to delete category' }, { status: 500 });
  }
}
