import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>SIBI App</title>
      </Head>
      <main style={{ padding: '2rem' }}>
        <h1>Welcome to SIBI</h1>
        <p style={{ fontSize: '0.85rem', color: '#555' }}>Version: v3.6.7d</p>
        <p>Upload an image of your bulk lot to get live item valuation from eBay.</p>
        {/* Add your upload form or component here */}
      </main>
    </>
  );
}