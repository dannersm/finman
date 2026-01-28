import 'dotenv/config';
import express from 'express';
import { runAllScrapers } from './scrapers/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.post('/scrape-transactions', async (req, res) => {
  try {
    const movements = await runAllScrapers();
    res.json({ success: true, data: movements });
  } catch (error) {
    console.error('[Scraper Error]:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
