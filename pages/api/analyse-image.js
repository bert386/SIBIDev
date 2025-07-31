import fetch from 'node-fetch';
import formidable from 'formidable';
import fs from 'fs';
import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const fetchPriceFromEbay = async (title) => {
  const query = encodeURIComponent(title);
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ebay-search?q=${query}`);
  const data = await res.json();
  console.log("eBay pricing result for", title, data);
  return data;
};

const getEbaySearchUrl = (title) => {
  const fullQuery = title;
  const encoded = encodeURIComponent(fullQuery);
  return `https://www.ebay.com.au/sch/i.html?_nkw=${encoded}&_sacat=0&LH_Sold=1&LH_Complete=1`;
};

export default async function handler(req, res) {
  const form = formidable({ keepExtensions: true });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'File parsing failed' });
    }

    const image = files.image?.[0];
    if (!image) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const imageBuffer = fs.readFileSync(image.filepath);

// TEMP: Test call to fetchPriceFromEbay directly



    const visionPrompt = `
You are an expert at identifying bulk items in online marketplace listings. List all items you see in the photo, including the  (e.g., Wii, PS2, Xbox). Format your response like this:

Summary: A short sentence about what's in the photo.
Titles:
1. [Full Item Title] ([Platform])
2. ...
    `.trim();

    const gptRes = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that understands images of video games and related media.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: visionPrompt },
            { type: 'image_url', image_url: { url: `data:${image.mimetype};base64,${imageBuffer.toString('base64')}` } },
          ],
        },
      ],
    });

    const raw = gptRes.choices[0].message.content;
    const summary = raw.split("Titles:")[0].replace("Summary:", "").trim();
    const lines = raw.split("Titles:")[1].trim().split("\n").filter(Boolean);

    const parsedItems = lines.map(line => {
      const match = line.match(/\d+\.\s*(.+?)\s*\(([^)]+)\)/);
      if (match) {
        return {
          full: `${match[1].trim()} (${match[2].trim()})`,
          title: match[1].trim(),
                  };
      } else {
        return { full: line.trim(), title: line.trim() };
      }
    });

    const itemsWithValue = parsedItems.map((item) => {
      // Mock value lookup — replace with real logic
      const mockValue = Math.floor(Math.random() * 15) + 2;
      return {
        item.full,
                value: `$${mockValue} AUD`,
        ebayUrl: getEbaySearchUrl(item.name),
        numeric: mockValue,
      };
    });

    const topItems = [...itemsWithValue]
      .sort((a, b) => b.numeric - a.numeric)
      .slice(0, 3)
      .map(i => `${i.name} – ${i.value}`);

    
    // Assume 'items' is an array of identified objects like:
    // [{ title: "Spyro: The Eternal Night": "Wii" }]
    for (let item of itemsWithValue) {
      const ebay = await fetchPriceFromEbay(item.name);
      if (ebay?.results?.length > 0) {
        const avg = ebay.results
          .map(r => parseFloat(r.price))
          .filter(n => !isNaN(n));
        const avgPrice = avg.length ? (avg.reduce((a, b) => a + b, 0) / avg.length).toFixed(2) : 'NRS';
        item.price = avgPrice;
        item.ebayUrl = `https://www.ebay.com.au/sch/i.html?_nkw=${encodeURIComponent(item.name)}&LH_Sold=1&LH_Complete=1`;
      } else {
        item.price = 'NRS';
        item.ebayUrl = null;
      }
    }
    
    res.status(200).json({
      summary: summary,
      items: itemsWithValue,
      topItems,
    });
  });
}