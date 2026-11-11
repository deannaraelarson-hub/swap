export default async function handler(req, res) {
  // Handle Preflight OPTIONS request correctly
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, details } = req.body;

  // Read credentials from Environment Variables
  const token = process.env.BOT_TOKEN; 
  const chatId = process.env.CHAT_ID;

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

    // FIX: Check if response is OK before parsing JSON
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Telegram API Error Response:", errorBody);
      throw new Error(`Telegram API Error: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    
    if (data.ok) {
      return res.status(200).json({ success: true });
    } else {
      console.error("Telegram API reported failure:", data);
      return res.status(500).json({ error: 'Telegram API Failure', details: data });
    }
  } catch (error) {
    console.error("Fetch Error:", error.message);
    return res.status(500).json({ error: 'Network Error', details: error.message });
  }
}
