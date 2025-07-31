import axios from 'axios';

export default async function handler(req, res) {
  const query = req.query.q;
  console.log('🔍 eBay query received:', query);
  if (!query) return res.status(400).json({ error: 'Missing query parameter ?q=' });

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    // Get access token
    const tokenResponse = await axios.post(
      'https://api.ebay.com/identity/v1/oauth2/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'https://api.ebay.com/oauth/api_scope'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      }
    );

    const token = tokenResponse.data.access_token;

    // Search eBay
    const ebayResponse = await axios.get(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY-AU'
        }
      }
    );

    const items = ebayResponse.data.itemSummaries || [];
    const parsedResults = items.map(item => ({
      title: item.title,
      price: item.price?.value || 'N/A',
      currency: item.price?.currency || '',
      condition: item.condition || '',
      url: item.itemWebUrl
    }));

    res.status(200).json({ results: parsedResults });

  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Failed to fetch from eBay',
      details: err.response?.data || err.message
    });
  }
}