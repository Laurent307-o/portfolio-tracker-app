// Vercel Serverless Function — Scan IA des captures d'écran courtier v2
// POST /api/scan  body: { images: ["data:image/png;base64,...", ...] }
// Réponse: { positions: [{ isin, name, quantity, pru, ticker?, needsVerification?, warning? }, ...] }

const ISIN_TO_TICKER = {
  "IE00B53L3W79": "CSX5.AS",
  "FR0000121329": "HO.PA",
  "FR0011871136": "PSPH.PA",
  "LU1834988518": "TNO.PA",
  "FR0000131104": "BNP.PA",
  "LU0252633754": "DAX.PA",
  "FR0013412020": "PAEEM.PA",
  "FR0011871110": "PUST.PA",
  "LU1900066033": "CHIP.PA",
  "IE000YYE6WK5": "DFNS.PA",
  "IE000I8KRLL9": "SEME.PA",
};

// Mapping inverse ticker → ISIN pour préremplissage après lookup Yahoo
const TICKER_TO_ISIN = Object.fromEntries(
  Object.entries(ISIN_TO_TICKER).map(([isin, t]) => [t.toUpperCase(), isin])
);

const SYSTEM_PROMPT = `Tu es un assistant d'extraction de données financières. Tu reçois une ou plusieurs captures d'écran d'un portefeuille boursier (Fortuneo, Boursorama, Bourse Direct, Saxo, Degiro, etc.).

Ta tâche : extraire TOUTES les positions (titres détenus) visibles sur les captures.

Pour chaque position, extrais :
- "isin"      : le code ISIN (12 caractères, commence par 2 lettres) SI VISIBLE. Si absent de la capture, mets null.
- "name"      : le nom complet du titre tel qu'affiché (ex: "THALES", "Amundi MSCI World UCITS ETF", "AMUNDI STOXX EUROPE 600 TECHNOLOGY UCITS"). OBLIGATOIRE.
- "quantity"  : la quantité détenue (nombre, peut être décimal pour les fractions).
- "pru"       : le PRU (Prix de Revient Unitaire) en euros. Cherche les colonnes "PRU", "Prix de revient", "Prix moyen", "Cours d'achat moyen". NE PAS confondre avec le cours actuel.

Règles strictes :
1. Réponds UNIQUEMENT avec un JSON valide, sans texte avant/après, sans markdown.
2. Format attendu : {"positions":[{"isin":null,"name":"...","quantity":N,"pru":N}, ...]}
3. Le champ "name" est OBLIGATOIRE. Les autres champs peuvent être null si illisibles.
4. Ignore les lignes "Liquidités", "Espèces", "Cash", "Solde", "Évaluation Titres", "+/- values".
5. Ignore les totaux, sous-totaux, et lignes de synthèse.
6. Si plusieurs captures montrent les MÊMES positions (même nom), ne les compte qu'une fois.
7. Les nombres : utilise le point décimal (193.90, pas 193,90). Pas de séparateur de milliers.
8. Si aucune position détectée, renvoie {"positions":[]}.
9. Extrait le nom COMPLET même s'il est tronqué avec "..." — mets ce qui est lisible.`;

// Recherche Yahoo Finance pour deviner le ticker + ISIN à partir du nom
// Priorise les marchés européens (.PA, .AS, .DE, .L, .MI) pour les PEA
async function yahooLookup(name) {
  try {
    const q = encodeURIComponent(name.slice(0, 80));
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${q}&quotesCount=10&newsCount=0&listsCount=0`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });
    if (!r.ok) return null;
    const data = await r.json();
    const quotes = Array.isArray(data?.quotes) ? data.quotes : [];
    if (quotes.length === 0) return null;

    // Priorité : Paris > Amsterdam > autres Euronext > Allemagne > Londres > US
    const priority = { PAR: 1, AMS: 2, BRU: 3, LIS: 4, GER: 5, LSE: 6, NMS: 7, NYQ: 8 };
    const scored = quotes
      .filter(q => q.symbol && (q.quoteType === "ETF" || q.quoteType === "EQUITY" || q.quoteType === "MUTUALFUND"))
      .map(q => ({
        symbol: q.symbol,
        longname: q.longname || q.shortname || "",
        exchange: q.exchange,
        score: priority[q.exchange] || 99,
      }))
      .sort((a, b) => a.score - b.score);

    if (scored.length === 0) return null;
    return { ticker: scored[0].symbol, matchedName: scored[0].longname };
  } catch (e) {
    console.error("Yahoo lookup failed for", name, e.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY missing" });
  }

  try {
    const { images } = req.body || {};
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "images[] required" });
    }
    if (images.length > 8) {
      return res.status(400).json({ error: "Max 8 images par scan" });
    }

    const content = [];
    for (const img of images) {
      let mediaType = "image/png";
      let data = img;
      const m = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(img);
      if (m) { mediaType = m[1]; data = m[2]; }
      if (data.length > 7_000_000) {
        return res.status(400).json({ error: "Image trop volumineuse (max ~5 Mo)" });
      }
      content.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data }
      });
    }
    content.push({
      type: "text",
      text: "Extrais toutes les positions des captures ci-dessus. Réponds uniquement avec le JSON."
    });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error("Claude API error:", r.status, err);
      return res.status(502).json({ error: "Claude API error", detail: err.slice(0, 500) });
    }

    const payload = await r.json();
    const text = payload?.content?.[0]?.text || "";

    let jsonStr = text.trim();
    const mdMatch = /```(?:json)?\s*([\s\S]+?)```/.exec(jsonStr);
    if (mdMatch) jsonStr = mdMatch[1].trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return res.status(502).json({ error: "Réponse Claude non-JSON", raw: text.slice(0, 800) });
    }

    const positions = Array.isArray(parsed?.positions) ? parsed.positions : [];

    // Filtre : on garde les positions avec au moins un nom
    const keep = positions.filter(p => p && typeof p.name === "string" && p.name.trim().length > 0);

    // Pour chaque position sans ISIN, on interroge Yahoo en parallèle
    const enriched = await Promise.all(keep.map(async (p) => {
      const hasIsin = typeof p.isin === "string" && p.isin.length >= 10;
      const isin = hasIsin ? String(p.isin).toUpperCase().trim() : null;
      const name = String(p.name).trim();
      const quantity = p.quantity != null ? Number(p.quantity) : null;
      const pru = p.pru != null ? Number(p.pru) : null;

      if (hasIsin) {
        return {
          isin,
          name,
          quantity,
          pru,
          ticker: ISIN_TO_TICKER[isin] || null,
          needsVerification: false,
        };
      }

      // Pas d'ISIN → Yahoo lookup
      const lookup = await yahooLookup(name);
      const suggestedTicker = lookup?.ticker || null;
      const suggestedIsin = suggestedTicker ? (TICKER_TO_ISIN[suggestedTicker.toUpperCase()] || null) : null;
      return {
        isin: suggestedIsin,
        name,
        quantity,
        pru,
        ticker: suggestedTicker,
        suggestedName: lookup?.matchedName || null,
        needsVerification: true,
        warning: suggestedIsin
          ? "ISIN non présent sur la capture : ISIN suggéré - à confirmer"
          : "ISIN non présent sur la capture : aucun ISIN connu pour ce ticker - merci de saisir manuellement",
      };
    }));

    return res.status(200).json({
      positions: enriched,
      count: enriched.length,
      usage: payload.usage || null,
    });
  } catch (e) {
    console.error("scan.js error:", e);
    return res.status(500).json({ error: e.message || "Internal error" });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: "25mb" } },
  maxDuration: 60,
};
