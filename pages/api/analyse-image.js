import { IncomingForm } from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getEbayValuation(title) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ebay-search?q=${encodeURIComponent(title)}`);
  const data = await res.json();
  const items = data.results || [];

  if (!items.length) return { value: 'NRS', url: '' };

  const prices = items
    .filter(i => i.price !== 'N/A')
    .map(i => parseFloat(i.price))
    .sort((a, b) => a - b)
    .slice(0, 3);

  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

  return {
    value: `$${avg.toFixed(0)} AUD`,
    url: items[0].url,
  };
}

export default async function handler(req, res) {
  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    const imageFile = files?.image?.[0] || files?.images?.[0] || Object.values(files)[0];

    if (!imageFile?.filepath) {
      console.error('File parsing failed. Formidable files:', files);
      return res.status(400).json({ error: 'No uploaded file detected' });
    }

    const buffer = fs.readFileSync(imageFile.filepath);
    const base64Image = buffer.toString('base64');

    const gptRes = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'List the items in this photo. Include brand and platform if known.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageFile.mimetype};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const text = gptRes.choices[0]?.message?.content || '';
    const lines = text.split('\n').filter(l => l.trim());
    const itemLines = lines.map(l => l.replace(/^\d+[).]?\s*/, '').trim());

    const results = [];

    for (const itemName of itemLines) {
      const ebay = await getEbayValuation(itemName);
      results.push({
        name: itemName,
        platform: '-',
        value: ebay.value,
        ebayLink: ebay.url,
      });
    }

    res.status(200).json({ items: results });
  });
}