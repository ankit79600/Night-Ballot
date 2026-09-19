export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end('Method Not Allowed');
    return;
  }

  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on('data', c => chunks.push(c));
    req.on('end', resolve);
    req.on('error', reject);
  });
  const body = Buffer.concat(chunks);

  try {
    const upstream = await fetch('https://proof-server.preview.midnight.network/prove', {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/octet-stream',
        'Content-Length': String(body.length),
      },
      body,
    });

    const responseBody = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status);
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    res.end(responseBody);
  } catch (err) {
    res.status(502).end(String(err));
  }
}
