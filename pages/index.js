
import React, { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const version = "v3.6.7l";

  return (
    <div>
      <h1>Welcome to SIBI</h1>
      <p><strong>Version:</strong> v3.6.7l</p>
      <p>Upload an image of your bulk lot to get live item valuation from eBay.</p>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button disabled={!file}>Analyse</button>
    </div>
  );
}
