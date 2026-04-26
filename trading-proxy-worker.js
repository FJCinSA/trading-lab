// =====================================================================
// FJC Trading Lab — Cloudflare Worker proxy for Anthropic Messages API
// =====================================================================
// Purpose: keep your Anthropic API key OFF the browser. The lab posts
// here; this Worker adds the key and forwards to api.anthropic.com.
//
// Required secret (set in Cloudflare → Worker → Settings → Variables):
//   ANTHROPIC_API_KEY    your sk-ant-... key
//
// Optional plain variable (same place):
//   ALLOWED_ORIGIN       defaults to https://fjcinsa.github.io
//                        change only if you serve the lab elsewhere
// =====================================================================

const DEFAULT_ALLOWED_ORIGIN = 'https://fjcinsa.github.io';

export default {
  async fetch(request, env) {
    const allowedOrigin = (env && env.ALLOWED_ORIGIN) || DEFAULT_ALLOWED_ORIGIN;

    const cors = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === 'GET') {
      return new Response(
        'FJC Trading Lab proxy is alive. POST a Messages API payload to use it.',
        { status: 200, headers: { ...cors, 'Content-Type': 'text/plain' } }
      );
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: cors });
    }

    if (!env || !env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server misconfigured: ANTHROPIC_API_KEY secret not set' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Validate the body is JSON before forwarding (cheap sanity check)
    let body;
    try {
      body = await request.text();
      JSON.parse(body);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body
      });

      const text = await upstream.text();
      return new Response(text, {
        status: upstream.status,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Upstream error: ' + (e && e.message || String(e)) }),
        { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
  }
};
