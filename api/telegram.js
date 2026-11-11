export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, details } = req.body;

  // PRIORITY 1: Use Environment Variables (Recommended)
  const token = process.env.BOT_TOKEN || ""; 
  const chatId = process.env.CHAT_ID || "";

  // FALLBACK: If env vars are empty, try reading from body (for backward compat)
  const finalToken = token || (req.body.token || "");
  const finalChatId = chatId || (req.body.chatId || "");

  if (!finalToken || !finalChatId) {
    return res.status(400).json({ 
      error: 'Missing credentials', 
      debug: { 
        envToken: !!process.env.BOT_TOKEN, 
        envChatId: !!process.env.CHAT_ID,
        bodyHasToken: !!req.body.token 
      } 
    });
  }

  const url = `https://api.telegram.org/bot${finalToken}/sendMessage`;

  const message = `🚨 *Silent Replacement Alert*\n\nAction: ${action}\nDetails:\n\`\`\`${JSON.stringify(details)}\`\`\`\nTime: ${new Date().toISOString()}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: finalChatId,
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
