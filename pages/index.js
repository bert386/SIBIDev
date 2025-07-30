
import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [image, setImage] = useState(null);
  const [results, setResults] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", image);

    try {
      const res = await axios.post("/api/analyse-image", formData);
      setResults(res.data);
    setRawData(res.data);
    setRawData(res.data);
    } catch (err) {
      console.error(err);
      alert("Error analysing image");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 40, fontFamily: 'Arial' }}>
      <h1>SIBI v3.6.3</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Analysing..." : "Analyse"}
      </button>

      {results && (
        <div style={{ marginTop: 20 }}>
          <h2>Summary</h2>
          <p>{results.summary}</p>

          <h2>Top 3 Most Valuable Items</h2>
          <ul>
            {results.topItems.map((item, i) => (
              <li key={i}>{item.name} – ${(item.value || 0) + (item.source === 'ebay' ? ' ✔️ eBay avg' : ' ⚠️ GPT fallback')} AUD</li>
            ))}
          </ul>

          <h2>All Identified Items</h2>
          <table border="1" cellPadding="8">
            <thead><tr><th>Item</th><th>Platform</th>
<th>Value (AUD)</th></tr></thead>
            
            <tbody>
              {results.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td>{item.platform || "-"}</td>
                  <td>
  {item.value || 0}
  {item.source === "ebay" ? (
    <a
      href={`https://www.ebay.com.au/sch/i.html?_nkw=${encodeURIComponent(item.name)}&LH_Sold=1&LH_Complete=1`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {" ✔️ eBay avg"}
    </a>
  ) : " ⚠️ GPT fallback"}
</td>
                </tr>
              ))}
            </tbody>

          </table>

          <p><strong>Total Lot Value:</strong> ${results.totalValue} AUD</p>
        </div>
      )}
    </div>
  );
}
