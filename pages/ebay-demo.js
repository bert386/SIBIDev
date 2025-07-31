import Head from 'next/head';
import { useEffect, useState } from 'react';

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


// Cache and deduplication logic
const ebayCache = new Map();

async function fetchUniqueEbayValuation(title) {
  if (ebayCache.has(title)) {
    return ebayCache.get(title);
  }

  try {
    const res = await fetch(`/api/ebay-search?q=${encodeURIComponent(title)}`);
    const data = await res.json();
    const items = data.results;

    if (!items || items.length === 0) {
      ebayCache.set(title, { value: 'NRS', url: '' });
      return { value: 'NRS', url: '' };
    }

    const values = items
      .filter(i => i.price !== 'N/A')
      .map(i => parseFloat(i.price))
      .sort((a, b) => a - b)
      .slice(0, 3);

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const result = { value: `$${avg.toFixed(0)} AUD`, url: items[0].url };

    ebayCache.set(title, result);
    return result;
  } catch (err) {
    console.error('eBay fetch failed', err);
    return { value: 'NRS', url: '' };
  }
}
export default function EbayDemo() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const sampleItems = [
      { name: "Pokemon Fire Red GBA", platform: "Game Boy Advance" },
      { name: "Mario Kart Wii", platform: "Wii" },
      { name: "Hot Wheels Treasure Hunt", platform: "Diecast" }
    ];

    async function enrich() {
      const results = [];
      for (const item of sampleItems) {
        const ebay = await fetchEbayValuation(item.name);
        results.push({
          name: item.name,
          platform: item.platform,
          value: ebay.value,
          ebayLink: ebay.url
        });
      }
      setItems(results);
    }

    enrich();
  }, []);

  return (
    <>
      <Head>
        <title>eBay Valuation Demo</title>
      </Head>
      <h1>eBay Valuation Demo</h1>
      <p style={{ fontSize: '0.85rem', color: '#555' }}>Version: v3.6.7d</p>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Item</th>
            <th>Platform</th>
            <th>Value (AUD)</th>
            <th>eBay</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>{item.name}</td>
              <td>{item.platform}</td>
              <td>{item.value}</td>
              <td>
                {item.ebayLink ? (
                  <a href={item.ebayLink} target="_blank" rel="noopener noreferrer">Last Solds</a>
                ) : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}