export default async function handler(req, res) {
  // 1. Handle Preflight OPTIONS request correctly
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end(); // CRITICAL: Use 204 No Content, NOT JSON
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, details } = req.body;

  // 2. Read credentials from Environment Variables (Vercel handles this securely)
  const token = process.env.BOT_TOKEN; 
  const chatId = process.env.CHAT_ID;

  // Debugging: Log to Vercel Logs to confirm env vars are read
  console.log("Env Token exists:", !!token);
  console.log("Env ChatId exists:", !!chatId);
  console.log("Payload:", { action, details });

  if (!token || !chatId) {
    return res.status(500).json({ 
      error: 'Missing Credentials', 
      debug: { 
        envToken: process.env.BOT_TOKEN ? "SET" : "MISSING", 
        envChatId: process.env.CHAT_ID ? "SET" : "MISSING"
      } 
    });
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const message = `🚨 *Silent Replacement Alert*\n\nAction: ${action}\nDetails:\n\`\`\`${JSON.stringify(details)}\`\`\`\nTime: ${new Date().toISOString()}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: 'Telegram API Error', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Network Error', details: error.message });
  }
}
