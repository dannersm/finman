
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { classifyTransactions } from '@/lib/classification';

const parseMovements = (movements) => {
    const cleanMovements = []
    for (const movement of movements) {
      if (!movement.amount){
        continue
      }
      const amount = parseFloat(movement.amount.replace('$', '').replace('.', '').replace('-', '')) 
      
      // Assuming the date is in DD/MM/YYYY format from the scraper
      const dateParts = movement.date.split('/');
      const isoDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);

      cleanMovements.push({
        date: isoDate,
        description: movement.description,
        amount: amount,
        source: movement.source,
        bank: movement.bank,
      })
    }
  return cleanMovements
}

const removeDuplicateMovs = (newMovs, dbMovs) => {
    const uniqueMovs = [];

    // Go through scraped movements one by one (most recent to least recent)
    for (const newMov of newMovs) {
      // Check if this movement matches any DB movement
      const matchFound = dbMovs.some(dbMov =>
        dbMov.description === newMov.description &&
        dbMov.date.getTime() === newMov.date.getTime() &&
        dbMov.amount === newMov.amount &&
        dbMov.bank === newMov.bank &&
        dbMov.source === newMov.source
      );

      // If a match is found, stop processing this category
      if (matchFound) {
        break;
      }

      // If no match, add to unique movements
      uniqueMovs.push(newMov);
    }

    return uniqueMovs;
}

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const transactionsCollection = db.collection('transactions');
    const categoriesCollection = db.collection('categories');

    console.log('Starting transaction update process...');
    
    // Call the Express server scraping endpoint
    const scraperUrl = process.env.SCRAPER_URL || 'http://localhost:3001';
    const scrapeResponse = await fetch(`${scraperUrl}/scrape-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!scrapeResponse.ok) {
      throw new Error(`Scraping service failed: ${scrapeResponse.status}`);
    }
    
    const respJson = await scrapeResponse.json();
    let newMovements = parseMovements(respJson.data)
    console.log(`Scraped ${newMovements.length} new movements.`);

    if (newMovements.length === 0) {
      return NextResponse.json({
        message: 'No new movements scraped.',
        added: 0,
      });
    }

    // Separate into credit and debit
    const creditMovements = newMovements.filter(mov => mov.source=="CREDIT_CARD")
    const debitMovements = newMovements.filter(mov => mov.source=="DEBIT_CARD")

    // Compute the earliest date (min) from scraped movements
    const allDates = newMovements.map(mov => mov.date);
    const minDate = new Date(Math.min(...allDates));

    // Calculate min date minus one day
    const searchDate = new Date(minDate);
    searchDate.setUTCDate(searchDate.getUTCDate() - 1);

    console.log(`Fetching DB movements from ${searchDate.toISOString()} onwards...`);

    // Fetch DB movements with date >= minDate - 1 day for each category
    const dbCreditMovs = await transactionsCollection.find({
      source: "CREDIT_CARD",
      date: { $gte: searchDate }
    }).toArray();

    const dbDebitMovs = await transactionsCollection.find({
      source: "DEBIT_CARD",
      date: { $gte: searchDate }
    }).toArray();

    console.log(`Found ${dbCreditMovs.length} credit and ${dbDebitMovs.length} debit movements in DB for comparison.`);

    // Remove duplicates for each category
    const uniqueCreditMovs = removeDuplicateMovs(creditMovements, dbCreditMovs);
    const uniqueDebitMovs = removeDuplicateMovs(debitMovements, dbDebitMovs);

    newMovements = [...uniqueCreditMovs, ...uniqueDebitMovs];
    console.log(`Found ${newMovements.length} unique new transactions to insert.`);

    if (newMovements.length > 0) {
      // Fetch categories and classify transactions before inserting
      const categories = await categoriesCollection.find({}).toArray();
      console.log(`Fetched ${categories.length} categories for classification.`);

      const classifiedMovements = classifyTransactions(newMovements, categories);
      console.log('Applied classification to new transactions.');

      await transactionsCollection.insertMany(classifiedMovements.reverse());
      console.log('Successfully inserted new transactions into the DB.');
    }

    return NextResponse.json({
      message: 'Transactions updated successfully',
      added: newMovements.length,
    });
  } catch (e) {
    console.error('Error updating transactions:', e);
    return NextResponse.json({ error: 'Unable to update transactions', details: e.message }, { status: 500 });
  }
}
