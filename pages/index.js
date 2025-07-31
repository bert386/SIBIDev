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

  return (
    <>
      <Head>
        <title>SIBI App</title>
      </Head>
      <main style={{ padding: '2rem' }}>
        <h1>Welcome to SIBI</h1>
        <p style={{ fontSize: '0.85rem', color: '#555' }}>Version: v3.6.7e</p>
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
            {result.items && (
              <table border="1" cellPadding="8">
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
                      <td>{item.name}</td>
                      <td>{item.platform}</td>
                      <td>{item.value}</td>
                      <td>
                        {item.ebayLink ? (
                          <a href={item.ebayLink} target="_blank" rel="noopener noreferrer">
                            Last Solds
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </>
  );
}