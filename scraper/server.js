import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { runAllScrapers } from './scrapers/index.js';
import { parseStatement } from './parsers/santanderPdf.js';

const app = express();
const PORT = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

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

app.post('/parse-statement', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No se recibió ningún archivo' });
  }

  try {
    const result = await parseStatement(req.file.buffer);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[PDF Parser Error]:', error.message);
    res.status(422).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
