import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://fynrtconvaupnteuwvfa.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default async function handler(req, res) {
  try {
    // Get all unique tickers from all positions
    const { data: positions } = await supabase
      .from('positions')
      .select('ticker')
      .not('ticker', 'is', null);
    
    const tickers = [...new Set((positions || []).map(p => p.ticker).filter(Boolean))];
    if (!tickers.length) return res.json({ message: 'No tickers to update', updated: 0 });

    // Fetch prices from Yahoo Finance
    const prices = {};
    await Promise.all(tickers.map(async (ticker) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const d = await r.json();
        const meta = d?.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) prices[ticker] = meta.regularMarketPrice;
      } catch (e) { console.error(`Failed: ${ticker}`, e.message); }
    }));

    // Update positions with current prices
    let updated = 0;
    for (const [ticker, price] of Object.entries(prices)) {
      const { count } = await supabase
        .from('positions')
        .update({ current_price: price, updated_at: new Date().toISOString() })
        .eq('ticker', ticker);
      updated += count || 0;
    }

    res.json({ message: 'Prices updated', tickers: Object.keys(prices).length, updated, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
