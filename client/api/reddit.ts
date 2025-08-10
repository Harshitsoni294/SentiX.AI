import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple Reddit proxy for hot posts and comments
// GET /api/reddit?mode=list&sub=technology&limit=12
// GET /api/reddit?mode=comments&permalink=/r/technology/comments/xxxxxx/post_title/&limit=9
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    const { mode = 'list' } = req.query as { [key: string]: string };
    const limit = Math.min(parseInt((req.query.limit as string) || '12', 10) || 12, 50);

    let target = '';
    if (mode === 'list') {
      const sub = (req.query.sub as string) || '';
      if (!sub) {
        res.status(400).json({ error: 'Missing sub' });
        return;
      }
      const s = encodeURIComponent(sub);
      target = `https://www.reddit.com/r/${s}/hot.json?limit=${limit}&raw_json=1&api_type=json`;
    } else if (mode === 'comments') {
      const permalink = (req.query.permalink as string) || '';
      if (!permalink || !permalink.startsWith('/')) {
        res.status(400).json({ error: 'Missing or invalid permalink' });
        return;
      }
      const safe = permalink.replace(/\/+$/, '');
      target = `https://www.reddit.com${safe}.json?limit=${limit}&raw_json=1&api_type=json`;
    } else {
      res.status(400).json({ error: 'Invalid mode' });
      return;
    }

    const upstream = await fetch(target, {
      headers: {
        'Accept': 'application/json',
        // Reddit recommends a descriptive UA for API use
        'User-Agent': 'PostCraftAI/1.0 (contact: you@example.com)'
      }
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      res.status(upstream.status).send(text);
      return;
    }

    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.setHeader('Content-Type', contentType);
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(200).send(buf);
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
