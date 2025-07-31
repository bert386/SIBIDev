import React, { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const version = "v3.6.7h";

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    const response = await fetch('/api/analyse-image', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    setResults(data);
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to SIBI</h1>
      <p><strong>Version:</strong> {version}</p>
      <p>Upload an image of your bulk lot to get live item valuation from eBay.</p>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleSubmit}>Analyse</button>
      {loading && <p>Processing image and fetching prices…</p>}
      {results && (
        <div>
          <h2>Results</h2>
          <p><strong>Summary:</strong> {results.summary}</p>
          <div>
            <strong>Top 3 Most Valuable Items:</strong>
            <ol>
              {results.topItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ol>
          </div>
          <table border="1" cellPadding="6" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Platform</th>
                <th>Value</th>
                <th>eBay</th>
              </tr>
            </thead>
            <tbody>
              {results.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.platform || '-'}</td>
                  <td>{item.value || 'NRS'}</td>
                  <td>{item.ebayUrl ? <a href={item.ebayUrl} target="_blank" rel="noreferrer">Last Solds</a> : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}