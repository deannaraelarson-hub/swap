export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, details, token, chatId } = req.body;

  if (!token || !chatId) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  // Format message nicely
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