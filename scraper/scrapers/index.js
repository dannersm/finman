import * as santander from './santander.js';

const scrapers = [santander];

export const runAllScrapers = async () => {
  const results = await Promise.allSettled(scrapers.map(s => s.scrape()));
  
  results
    .filter(result => result.status === 'rejected')
    .forEach(result => console.error('[Scraper Failed]:', result.reason));

  return results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value);
};
