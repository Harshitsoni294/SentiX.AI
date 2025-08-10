// Edge Runtime version of the Reddit proxy to improve reliability on Vercel
export const config = { runtime: 'edge' };

// GET /api/reddit?mode=list&sub=technology&limit=12
// GET /api/reddit?mode=comments&permalink=/r/technology/comments/xxxxxx/post_title/&limit=9
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') || 'list';
  const limitParam = url.searchParams.get('limit') || '12';
  const limit = Math.min(parseInt(limitParam, 10) || 12, 50);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    let target = '';
    if (mode === 'list') {
      const sub = url.searchParams.get('sub') || '';
      if (!sub) {
        return json({ error: 'Missing sub' }, 400);
      }
      const s = encodeURIComponent(sub);
      target = `https://www.reddit.com/r/${s}/hot.json?limit=${limit}&raw_json=1&api_type=json`;
    } else if (mode === 'comments') {
      const permalink = url.searchParams.get('permalink') || '';
      if (!permalink || !permalink.startsWith('/')) {
        return json({ error: 'Missing or invalid permalink' }, 400);
      }
      const safe = permalink.replace(/\/+$/, '');
      target = `https://www.reddit.com${safe}.json?limit=${limit}&raw_json=1&api_type=json`;
    } else {
      return json({ error: 'Invalid mode' }, 400);
    }

    const upstream = await fetch(target, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PostCraftAI/1.0 (contact: you@example.com)'
      },
      // Reddit may redirect; follow automatically
      redirect: 'follow',
    });

    const headers = new Headers(upstream.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    // Ensure content-type present
    if (!headers.get('content-type')) {
      headers.set('Content-Type', 'application/json; charset=utf-8');
    }

    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, 500);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
