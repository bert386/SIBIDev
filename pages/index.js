import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/analyse-image", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      console.log("Analysis Result:", data);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to analyse image.");
    }
  };

  return (
    <div>
      <h1>Welcome to SIBI</h1>
      <p><strong>Version:</strong> v3.6.7m</p>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit">Analyse</button>
      </form>
    </div>
  );
}
