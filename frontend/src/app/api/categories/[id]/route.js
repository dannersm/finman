
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function PATCH(request, { params }) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const categoriesCollection = db.collection('categories');
    const { id } = await params;
    const categoryData = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const { id: categoryId, ...updateData } = categoryData;

    const result = await categoriesCollection.updateOne(
      { _id: ObjectId.createFromHexString(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, updatedId: id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to update category' }, { status: 500 });
  }
}

