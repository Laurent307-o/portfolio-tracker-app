// Vercel Serverless Function — Scan IA des captures d'écran courtier
// POST /api/scan  body: { images: ["data:image/png;base64,...", ...] }
// Réponse: { positions: [{ isin, name, quantity, pru, ticker? }, ...], raw? }

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

const SYSTEM_PROMPT = `Tu es un assistant d'extraction de données financières. Tu reçois une ou plusieurs captures d'écran d'un portefeuille boursier (Fortuneo, Boursorama, Bourse Direct, Saxo, Degiro, etc.).

Ta tâche : extraire TOUTES les positions (titres détenus) visibles sur les captures.

Pour chaque position, extrais :
- "isin"      : le code ISIN (12 caractères, commence par 2 lettres). Obligatoire.
- "name"      : le nom complet du titre tel qu'affiché (ex: "THALES", "Amundi MSCI World UCITS ETF").
- "quantity"  : la quantité détenue (nombre, peut être décimal pour les fractions).
- "pru"       : le PRU (Prix de Revient Unitaire) en euros. Cherche les colonnes "PRU", "Prix de revient", "Prix moyen", "Cours d'achat moyen". NE PAS confondre avec le cours actuel.

Règles strictes :
1. Réponds UNIQUEMENT avec un JSON valide, sans texte avant/après, sans markdown.
2. Format attendu : {"positions":[{"isin":"...","name":"...","quantity":N,"pru":N}, ...]}
3. Si une valeur est illisible ou absente, mets null pour ce champ.
4. Ignore les lignes "Liquidités", "Espèces", "Cash", "Solde".
5. Ignore les totaux, sous-totaux, et lignes de synthèse.
6. Si plusieurs captures montrent les MÊMES positions, ne les compte qu'une fois.
7. Les nombres : utilise le point décimal (193.90, pas 193,90). Pas de séparateur de milliers.
8. Si aucune position détectée, renvoie {"positions":[]}.`;

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

    // Construit le contenu multimodal
    const content = [];
    for (const img of images) {
      // data:image/png;base64,xxxx  ou directement base64
      let mediaType = "image/png";
      let data = img;
      const m = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(img);
      if (m) { mediaType = m[1]; data = m[2]; }
      if (data.length > 7_000_000) { // ~5 Mo décodé
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

    // Extrait le JSON (robuste : enlève ```json ... ``` si présent)
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

    // Post-traitement : nettoyage + ajout du ticker si ISIN connu
    const cleaned = positions
      .filter(p => p && typeof p.isin === "string" && p.isin.length >= 10)
      .map(p => ({
        isin: String(p.isin).toUpperCase().trim(),
        name: p.name ? String(p.name).trim() : "",
        quantity: p.quantity != null ? Number(p.quantity) : null,
        pru: p.pru != null ? Number(p.pru) : null,
        ticker: ISIN_TO_TICKER[String(p.isin).toUpperCase().trim()] || null,
      }));

    return res.status(200).json({
      positions: cleaned,
      count: cleaned.length,
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
