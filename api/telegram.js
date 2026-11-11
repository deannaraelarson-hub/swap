export default async function handler(req, res) {
  // Handle Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, details } = req.body;

  // Read credentials from Environment Variables
  const token = process.env.BOT_TOKEN || ""; 
  const chatId = process.env.CHAT_ID || "";

  // Debugging: Log what we received
  console.log("Received Payload:", { action, details });
  console.log("Env Config:", { hasToken: !!token, hasChatId: !!chatId });

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
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ success: true });
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(500).json({ error: 'Telegram API Error', details: data });
    }
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Network Error', details: error.message });
  }
}
