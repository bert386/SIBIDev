import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/analyse-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      setResult({ error: 'Upload failed.' });
    } finally {
      setLoading(false);
    }
  };

  const cleanText = (text) => text.replace(/[*_~`]+/g, '').trim();

  const getTop3 = (items) => {
    return [...items]
      .filter(i => i.value && i.value !== 'NRS')
      .map(i => ({ ...i, numeric: parseFloat(i.value.replace(/[^0-9.]/g, '')) }))
      .sort((a, b) => b.numeric - a.numeric)
      .slice(0, 3);
  };

  const getEbaySearchUrl = (itemName) => {
    const query = encodeURIComponent(cleanText(itemName));
    return `https://www.ebay.com.au/sch/i.html?_nkw=${query}&_sacat=0&LH_Sold=1&LH_Complete=1`;
  };

  return (
    <>
      <Head>
        <title>SIBI App</title>
      </Head>
      <main style={{ padding: '2rem' }}>
        <h1>Welcome to SIBI</h1>
        <p style={{ fontSize: '0.85rem', color: '#555' }}>Version: v3.6.7g</p>
        <p>Upload an image of your bulk lot to get live item valuation from eBay.</p>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginTop: '1rem' }}
        />
        <br />
        <button onClick={handleUpload} disabled={loading || !file} style={{ marginTop: '1rem' }}>
          {loading ? 'Analysing...' : 'Analyse'}
        </button>

        {result && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Results</h3>
            {result.error && <p style={{ color: 'red' }}>{result.error}</p>}

            {result.items && result.items.length > 0 && (
              <>
                <p><strong>Summary:</strong> {cleanText(result.items[0].name)}</p>

                <div>
                  <p><strong>Top 3 Most Valuable Items:</strong></p>
                  <ol>
                    {getTop3(result.items).map((item, i) => (
                      <li key={i}>
                        {cleanText(item.name)} – {item.value}
                      </li>
                    ))}
                  </ol>
                </div>

                <table border="1" cellPadding="8" style={{ marginTop: '1rem' }}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Platform</th>
                      <th>Value</th>
                      <th>eBay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item, i) => (
                      <tr key={i}>
                        <td>{cleanText(item.name)}</td>
                        <td>{item.platform}</td>
                        <td>{item.value}</td>
                        <td>
                          <a href={getEbaySearchUrl(item.name)} target="_blank" rel="noopener noreferrer">
                            Last Solds
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}