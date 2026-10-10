// Vercel serverless function: receives a quiz lead and sends it to Telegram.
// Needs env vars TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (Project Settings → Environment Variables).
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: 'Telegram env vars are not set' });
  }

  let d = req.body;
  if (typeof d === 'string') {
    try { d = JSON.parse(d); } catch (e) { d = null; }
  }
  if (!d || typeof d !== 'object') {
    return res.status(400).json({ ok: false, error: 'Bad body' });
  }

  const clip = (v, n = 200) => String(v == null ? '' : v).slice(0, n);
  const list = (v) => (Array.isArray(v) ? v.slice(0, 12).map((x) => clip(x, 120)).join('; ') : clip(v));

  const email = clip(d.email, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Bad email' });
  }

  const text = [
    'New lead: His Style Makeover',
    '',
    `Email: ${email}`,
    `Style tips opt-in: ${d.tips ? 'yes' : 'no'}`,
    `Age: ${clip(d.age, 20)}`,
    `What bothers her: ${list(d.bothers)}`,
    `His style now: ${clip(d.style_now, 60)}`,
    `Already tried: ${list(d.tried)}`,
    `Body shape: ${clip(d.shape, 40)}`,
    `Occasions: ${list(d.occasions)}`,
    `Direction: ${clip(d.direction, 60)}`,
    `Looks picked: ${clip(d.looks, 3)}`,
    `What made it hard: ${list(d.barriers)}`,
    `Wants: ${list(d.desires)}`,
  ].join('\n');

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!r.ok) {
      return res.status(502).json({ ok: false, error: 'Telegram error ' + r.status });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'Telegram unreachable' });
  }
};
