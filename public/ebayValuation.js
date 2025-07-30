async function fetchEbayValuation(title) {
  try {
    const res = await fetch(`/api/ebay-search?q=${encodeURIComponent(title)}`);
    const data = await res.json();
    const items = data.results;

    if (!items || items.length === 0) return { value: 'NRS', url: '' };

    const values = items
      .filter(i => i.price !== 'N/A')
      .map(i => parseFloat(i.price))
      .sort((a, b) => a - b)
      .slice(0, 3);

    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return {
      value: `$${avg.toFixed(0)} AUD`,
      url: items[0].url
    };
  } catch (err) {
    console.error('eBay fetch failed', err);
    return { value: 'NRS', url: '' };
  }
}