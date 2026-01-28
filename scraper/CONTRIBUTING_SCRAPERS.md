# Contributing Scrapers

This project uses a simple "Contract" based approach to support multiple bank scrapers. You can add support for a new bank or source (email, API, etc.) without touching the core server logic.

## How to add a new Scraper

1.  Create a new file in the `scrapers/` directory (e.g., `banco-chile.js`).
2.  Your file **MUST** export a function named `scrape`.
3.  The `scrape` function **MUST** return a Promise that resolves to an Array of objects.

### The Output Contract

Each object in the returned array must adhere to the following structure:

```javascript
[
  {
    date: "DD/MM/YYYY",   // Date string.
    amount: "12345",      // Amount as string (or number).
    description: "Uber Eats", // Transaction description.
    bank: "Banco Chile",  // The name of the bank/source.
    source: "CREDIT_CARD" // e.g., "CREDIT_CARD", "CHECKING_ACCOUNT"
  },
  // ... more transactions
]
```

### Example Scraper (`scrapers/example-bank.js`)

```javascript
export const scrape = async () => {
  // Your logic here (Playwright, fetch, IMAP, etc.)
  
  return [
    {
      date: "12/05/2024",
      amount: "5000",
      description: "Test Transaction",
      bank: "Example Bank",
      source: "DEBIT"
    }
  ];
};
```

### Registering your Scraper

1.  Open `scrapers/index.js`.
2.  Import your new scraper.
3.  Add it to the `scrapers` array.

```javascript
import * as santander from './santander.js';
import * as myNewBank from './banco-chile.js'; // <--- Import here

const scrapers = [santander, myNewBank]; // <--- Add here

// ...
```

That's it! The server will automatically run your scraper in parallel with others when the `/scrape-transactions` endpoint is called.
