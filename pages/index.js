
export default function Home() {
  return (
    <div>
      <h1>Welcome to SIBI</h1>
      <p>Version: v3.6.7j</p>
      <p>Upload an image of your bulk lot to get live item valuation from eBay.</p>
      <form method="post" action="/api/analyse-image" encType="multipart/form-data">
        <input type="file" name="image" />
        <button type="submit">Analyse</button>
      </form>
    </div>
  );
}
