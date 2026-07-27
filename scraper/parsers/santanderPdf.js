import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import fs from "node:fs";

const PDF_PASSWORD = "19307947";

const runPdftotext = (filePath, password) => {
  const args = [];
  if (password) args.push("-upw", password);
  args.push("-layout", filePath, "-");
  return execFileSync("pdftotext", args, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  });
};

const extractLayoutText = async (buffer) => {
  const dir = await mkdtemp(path.join(tmpdir(), "cartola-"));
  const filePath = path.join(dir, "statement.pdf");
  try {
    fs.writeFileSync(filePath, buffer);
    try {
      return runPdftotext(filePath, null);
    } catch (err) {
      // Retry with the known unlock password if the PDF requires one.
      try {
        return runPdftotext(filePath, PDF_PASSWORD);
      } catch {
        throw new Error("No se pudo abrir el PDF (contraseña incorrecta o archivo dañado)");
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

const detectStatementType = (text) => {
  if (/TARJETA DE CR[ÉE]DITO/i.test(text)) return "CREDIT_CARD";
  if (/CUENTA CORRIENTE/i.test(text)) return "DEBIT_CARD";
  return null;
};

const parseAmount = (str) => parseInt(str.replace(/\./g, ""), 10);

// Each real movement line looks like:
//   "<LUGAR?>   DD/MM/YYYY <DESCRIPCIÓN>   [<MONEDA> <MONTO ORIGEN>]   $ <MONTO>"
// Requiring exactly one space (then a non-space char) between the date and the
// description excludes the "PAGAR HASTA ... $ <total>" recap line, whose date is
// followed only by a long run of spaces before the amount.
const CREDIT_CARD_ROW = /^.*?(\d{2}\/\d{2}\/\d{4})\s(\S.*?)\s{2,}.*\$\s*(-?[\d.,]+)\s*$/;

const parseCreditCardMovements = (text) => {
  const movements = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (!/\d{2}\/\d{2}\/\d{4}/.test(line) || !line.includes("$")) continue;

    const match = line.match(CREDIT_CARD_ROW);
    if (!match) continue;

    const [, date, description, amountStr] = match;
    const amount = parseAmount(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) continue; // skip payments/credit notes, keep only gastos

    const [dd, mm, yyyy] = date.split("/");
    movements.push({
      date: `${yyyy}-${mm}-${dd}`,
      description: description.trim(),
      amount,
    });
  }
  return movements;
};

const resolveYear = (day, month, desde, hasta) => {
  for (const year of [desde.getUTCFullYear(), hasta.getUTCFullYear()]) {
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (candidate >= desde && candidate <= hasta) return year;
  }
  return hasta.getUTCFullYear();
};

const DEBIT_ROW = /^(\d{2})\/(\d{2})\s+(.+)$/;
// "CHEQUES Y OTROS CARGOS" / "DEPOSITOS Y OTROS ABONOS" / "SALDO" are printed as
// fixed-width, right-aligned columns; classify each amount by where it ends on the line.
const AMOUNT_TOKEN = /(?<!\S)-?\d{1,3}(?:\.\d{3})*(?!\S)/g;
const CARGOS_COLUMN_END = 120;

const parseDebitAccountMovements = (text) => {
  const headerSection = text.split(/DETALLE DE MOVIMIENTOS/)[0];
  const headerDates = [...headerSection.matchAll(/(\d{2}\/\d{2}\/\d{4})/g)].map((m) => m[1]);
  if (headerDates.length < 2) {
    throw new Error("No se pudo determinar el periodo (DESDE/HASTA) de la cartola");
  }
  const [desdeStr, hastaStr] = headerDates;
  const [dD, dM, dY] = desdeStr.split("/").map(Number);
  const [hD, hM, hY] = hastaStr.split("/").map(Number);
  const desde = new Date(Date.UTC(dY, dM - 1, dD));
  const hasta = new Date(Date.UTC(hY, hM - 1, hD));

  // "Resumen de Comisiones" restates commission lines already present in the main
  // ledger above it (e.g. COM.MANTENCION PLAN) — drop it to avoid double-counting.
  const ledgerText = text.split(/Resumen de Comisiones/)[0];

  const movements = [];
  for (const rawLine of ledgerText.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    const match = line.trimStart().match(DEBIT_ROW);
    if (!match) continue;

    const [, dd, mm, rest] = match;
    const cols = rest.trim().split(/\s{2,}/).filter(Boolean);
    if (cols.length < 2) continue;
    const description = cols[1];
    if (!description) continue;

    let cargo = null;
    let tokenMatch;
    AMOUNT_TOKEN.lastIndex = 0;
    while ((tokenMatch = AMOUNT_TOKEN.exec(line)) !== null) {
      const end = tokenMatch.index + tokenMatch[0].length;
      if (end <= CARGOS_COLUMN_END) cargo = tokenMatch[0];
    }
    if (!cargo) continue; // no charge on this row (deposit-only or informational row)

    const amount = parseAmount(cargo);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    const year = resolveYear(day, month, desde, hasta);
    movements.push({
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      description,
      amount,
    });
  }
  return movements;
};

/**
 * Parses a Santander bank statement PDF (credit card or checking account).
 * @param {Buffer} buffer - raw PDF file contents.
 * @returns {Promise<{ type: 'CREDIT_CARD'|'DEBIT_CARD', bank: string, movements: Array<{date: string, description: string, amount: number}> }>}
 */
export const parseStatement = async (buffer) => {
  const text = await extractLayoutText(buffer);
  const type = detectStatementType(text);
  if (!type) {
    throw new Error("El PDF no corresponde a una cartola de cuenta corriente ni de tarjeta de crédito");
  }

  const movements = type === "CREDIT_CARD" ? parseCreditCardMovements(text) : parseDebitAccountMovements(text);

  return { type, bank: "Santander", movements };
};
