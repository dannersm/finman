import { firefox } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

firefox.use(StealthPlugin());

const CONFIG = {
  urls: {
    login: "https://mibanco.santander.cl/UI.Web.HB/Private_new/frame/#/public/login-frame/ing/0010",
    creditCard: "https://mibanco.santander.cl/UI.Web.HB/Private_new/frame/#/private/Saldos_TC/main/bill",
    debitAccount: "https://mibanco.santander.cl/UI.Web.HB/Private_new/frame/#/private/saldos/main/movimientos",
  },
  selectors: {
    rut: "#rut",
    pass: "#pass",
    row: ".mat-row",
    cell: ".mat-cell",
  },
  timeouts: {
    stability: 2000,
    maxWait: 15000,
    manualLogin: 60000,
  }
};

const MONTHS_ES = {
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
  julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
};

// Some tables (e.g. debit account movements) spell dates out for screen
// readers as "7 de septiembre de 2026". That form carries the year, unlike
// the visible "DD/MM" short form, so prefer it when available.
const parseSpanishLongDate = (text) => {
  if (!text) return null;
  const match = text.trim().toLowerCase().match(/^(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})$/);
  if (!match) return null;
  const month = MONTHS_ES[match[2]];
  if (!month) return null;
  return `${match[1].padStart(2, '0')}/${month}/${match[3]}`;
};

// Date/amount cells on some tables render a visible span plus a
// visually-hidden accessibility span spelling the same value out in words
// right next to it (e.g. "-$12.350" + "menos doce mil trescientos cincuenta
// pesos"). textContent() on the cell concatenates both, corrupting the
// value, so pull the specific span instead.
const getAccessibleText = async (cell, selector) => {
  const el = cell.locator(selector).first();
  if ((await el.count()) === 0) return null;
  const text = await el.textContent();
  return text ? text.trim() : null;
};

const extractPageTable = async (page) => {
  await page.waitForSelector(CONFIG.selectors.cell);

  let previousCount = 0;
  let stableCount = 0;
  const startTime = Date.now();

  while (Date.now() - startTime < CONFIG.timeouts.maxWait) {
    const currentCount = await page.locator(CONFIG.selectors.row).count();
    if (currentCount === previousCount && currentCount > 0) {
      stableCount++;
      if (stableCount >= 4) break;
    } else {
      stableCount = 0;
    }
    previousCount = currentCount;
    await page.waitForTimeout(500);
  }

  const rows = [];
  const rowLocators = page.locator(CONFIG.selectors.row);
  const count = await rowLocators.count();
  let lastDateSeen = null;

  for (let i = 0; i < count; i++) {
    const row = rowLocators.nth(i);
    const dateCell = row.locator("td").nth(0);
    const amountCell = row.locator("td").nth(3);

    const description = (await row.locator("td").nth(2).textContent())?.trim();

    const longDate = await getAccessibleText(dateCell, '.sr-only');
    const shortDate = await getAccessibleText(dateCell, '[aria-hidden="true"]');
    const date = parseSpanishLongDate(longDate) || shortDate || (await dateCell.textContent())?.trim();

    const amount = (await getAccessibleText(amountCell, '[aria-hidden="true"]')) || (await amountCell.textContent())?.trim();

    if (date) lastDateSeen = date;

    rows.push({
      date: lastDateSeen,
      description: description || null,
      amount: amount || null,
      location: null
    });
  }
  return rows;
};

const checkLoginStatus = async (page) => {
  const url = page.url();
  const isPrivate = url.toLowerCase().includes('/private');
  const isPublic = url.toLowerCase().includes('/public') || url.toLowerCase().includes('/login');
  return isPrivate && !isPublic;
};

const formatMovementDate = (dateStr) => {
  if (!dateStr || !dateStr.includes("/")) return dateStr;
  if (dateStr.split("/").length === 3) return dateStr; // already DD/MM/YYYY

  const now = new Date();
  const currentYear = now.getFullYear();
  const [day, month] = dateStr.split("/").map(Number);
  const candidateDate = new Date(currentYear, month - 1, day);

  // If date is more than 5 days in the future, it probably belongs to last year
  const futureThreshold = new Date(now);
  futureThreshold.setDate(now.getDate() + 5);
  
  const year = candidateDate > futureThreshold ? currentYear - 1 : currentYear;
  return `${dateStr}/${year}`;
};

export const scrape = async () => {
  const browser = await firefox.launch({ headless: false });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(CONFIG.urls.login);
    await page.waitForLoadState("domcontentloaded");

    await page.locator(CONFIG.selectors.rut).pressSequentially(process.env.BANK_RUT, { delay: 100 });
    await page.locator(CONFIG.selectors.pass).pressSequentially(process.env.BANK_PASSWORD, { delay: 200 });
    await page.keyboard.press("Enter");

    let loggedIn = await (async () => {
      await page.waitForTimeout(5000);
      return checkLoginStatus(page);
    })();

    if (!loggedIn) {
      console.log("⚠️  Challenge detected. Retrying credentials...");
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      
      if (await page.locator(CONFIG.selectors.pass).isVisible()) {
        console.log("Re-entering password...");
        await page.locator(CONFIG.selectors.pass).fill(process.env.BANK_PASSWORD);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(5000);
        loggedIn = await checkLoginStatus(page);
      }
    }

    if (!loggedIn) {
      console.log("⚠️  Login challenge persists. Waiting for manual intervention (60s)...");
      const startWait = Date.now();
      while (Date.now() - startWait < CONFIG.timeouts.manualLogin) {
        await page.waitForTimeout(2000);
        if (await checkLoginStatus(page)) {
          console.log("✓ Login completed manually, continuing...");
          loggedIn = true;
          break;
        }
      }
    }

    if (!loggedIn) throw new Error("Authentication failed: Timeout waiting for login.");
    
    console.log("✓ Login successful");

    // Scrape Credit Card
    console.log("Scraping Credit Card...");
    await page.goto(CONFIG.urls.creditCard, { waitUntil: "load" });
    const creditRows = await extractPageTable(page);
    console.log(`Found ${creditRows.length} credit card movements.`);

    // Scrape Debit Account
    console.log("Scraping Debit Account...");
    await page.goto(CONFIG.urls.debitAccount, { waitUntil: "load" });
    const debitRows = await extractPageTable(page);
    console.log(`Found ${debitRows.length} debit account movements.`);

    return [
      ...creditRows.map(r => ({
        source: "CREDIT_CARD",
        bank: "Santander",
        ...r,
        date: formatMovementDate(r.date)
      })),
      ...debitRows.map(r => ({
        source: "DEBIT_CARD",
        bank: "Santander",
        ...r,
        date: formatMovementDate(r.date)
      }))
    ];

  } finally {
    await browser.close();
  }
};
