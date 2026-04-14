export default async function handler(req, res) {
  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ error: 'tickers param required' });
  
  const list = tickers.split(',').slice(0, 30);
  const prices = {};
  const errors = [];
  
  await Promise.all(list.map(async (ticker) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const d = await r.json();
      const meta = d?.chart?.result?.[0]?.meta;
      if (meta) {
        prices[ticker] = {
          price: meta.regularMarketPrice,
          previousClose: meta.chartPreviousClose,
          currency: meta.currency,
          name: meta.shortName || meta.longName || ticker,
          timestamp: meta.regularMarketTime
        };
      } else { errors.push(ticker); }
    } catch (e) { errors.push(ticker); }
  }));
  
  res.setHeader('Cache-Control', 's-maxage=300');
  res.json({ prices, errors, updated: new Date().toISOString() });
}
