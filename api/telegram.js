export default async function handler(req, res) {
  // Handle CORS Preflight
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

  // Read from Environment Variables
  const token = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;

  // LOGGING FOR DEBUGGING
  console.log("=== TELEGRAM API DEBUG ===");
  console.log("Incoming Payload:", JSON.stringify({ action, details }));
  console.log("Env BOT_TOKEN:", token ? "SET" : "MISSING");
  console.log("Env CHAT_ID:", chatId ? "SET" : "MISSING");

  // If tokens are missing, return a clear 500 error
  if (!token || !chatId) {
    return res.status(500).json({ 
      error: 'Missing Environment Variables',
      debug: { hasToken: !!token, hasChatId: !!chatId }
    });
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const message = `🚨 *Silent Replacement Alert*\n\nAction: ${action}\nDetails:\n\`\`\`${JSON.stringify(details)}\`\`\`\nTime: ${new Date().toISOString()}`;

  try {
    console.log("Attempting to fetch Telegram API...");
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Some regions/networks need this header for stability
        'User-Agent': 'SilentReplacementBot/1.0'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Telegram API Response:", data);
      throw new Error(`Telegram API Error: ${data.description || 'Unknown'}`);
    }

    if (data.ok) {
      console.log("Success! Message ID:", data.result?.message_id);
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: 'Telegram API Failure', details: data });
    }
  } catch (error) {
    console.error("Fetch Error:", error.message, error.stack);
    return res.status(500).json({ error: 'Network Error', details: error.message });
  }
}
