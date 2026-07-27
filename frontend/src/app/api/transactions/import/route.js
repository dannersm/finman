import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { classifyTransactions } from '@/lib/classification';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Debes adjuntar un archivo PDF' }, { status: 400 });
    }

    const scraperUrl = process.env.SCRAPER_URL || 'http://localhost:3001';
    const forwardForm = new FormData();
    forwardForm.append('file', file, file.name || 'cartola.pdf');

    const parseResponse = await fetch(`${scraperUrl}/parse-statement`, {
      method: 'POST',
      body: forwardForm,
    });

    const parseJson = await parseResponse.json();

    if (!parseResponse.ok || !parseJson.success) {
      return NextResponse.json(
        { error: parseJson.error || 'No se pudo procesar el PDF' },
        { status: 422 }
      );
    }

    const { type: source, bank, movements } = parseJson.data;

    if (!movements || movements.length === 0) {
      return NextResponse.json({
        message: 'No se encontraron movimientos (gastos) en el PDF',
        source,
        deleted: 0,
        inserted: 0,
      });
    }

    const parsedMovements = movements.map((m) => ({
      date: new Date(m.date),
      description: m.description,
      amount: m.amount,
      source,
      bank,
    }));

    const dateTimes = parsedMovements.map((m) => m.date.getTime());
    const minDate = new Date(Math.min(...dateTimes));
    const maxDate = new Date(Math.max(...dateTimes));
    maxDate.setUTCHours(23, 59, 59, 999);

    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const transactionsCollection = db.collection('transactions');
    const categoriesCollection = db.collection('categories');

    // Replace whatever was previously recorded for this source within the
    // statement's date range, so re-importing the same PDF is idempotent.
    const deleteResult = await transactionsCollection.deleteMany({
      source,
      date: { $gte: minDate, $lte: maxDate },
    });

    const categories = await categoriesCollection.find({}).toArray();
    const classifiedMovements = classifyTransactions(parsedMovements, categories);

    await transactionsCollection.insertMany(classifiedMovements);

    return NextResponse.json({
      message: 'Cartola importada correctamente',
      source,
      deleted: deleteResult.deletedCount,
      inserted: classifiedMovements.length,
    });
  } catch (e) {
    console.error('Error importing statement:', e);
    return NextResponse.json(
      { error: 'No se pudo importar la cartola', details: e.message },
      { status: 500 }
    );
  }
}
