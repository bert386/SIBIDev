import formidable from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export const config = {
  api: {
    bodyParser: false
  }
};

// Helper: Sleep for a short duration between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Get average sold price from eBay.com.au sold listings
async function getAverageSoldPrice(itemName) {
  console.log(`🔍 Scraping eBay for: ${itemName}`);
  const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(itemName)}&LH_Sold=1&LH_Complete=1`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const prices = [];
    $('.s-item .s-item__price').each((i, el) => {
      if (prices.length >= 10) return;
      const priceText = $(el).text();
      const match = priceText.replace(/,/g, '').match(/\$([\d\.]+)/);
      if (match) {
        prices.push(parseFloat(match[1]));
      }
    });

    console.log(`🧾 Found ${prices.length} prices:`, prices);

    if (prices.length === 0) return null;
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return Math.round(avg);
  } catch (e) {
    console.error(`❌ Error scraping eBay for "${itemName}":`, e);
    return null;
  }
}

export default async function handler(req, res) {
  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err || !files.image) {
      console.error("Error parsing file", err);
      return res.status(500).json({ error: 'File parsing failed' });
    }

    const imageFile = files.image;
    const filePath = Array.isArray(imageFile) ? imageFile[0].filepath : imageFile.filepath;

    try {
      const imageData = fs.readFileSync(filePath);
      const base64Image = imageData.toString('base64');

      const completion = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: `Identify all items in this image and return a structured JSON object with the following keys:
- summary (2-sentence paragraph)
- totalValue (AUD)
- topItems (array of 3 items with name and value)
- items (array of all identified items with: name, value, and platform — platform should be included only if the item is a video game, otherwise use a dash '-').

IMPORTANT: Each item name must be detailed enough for online price lookup. Include item type in the name. For example:
- "Wii Fit Game (Nintendo Wii)" — not just "Wii Fit"
- "Black Nintendo Wii Console" — not just "Nintendo Wii"
- "Friends: Season 1-10 (DVD Complete Series)"

Avoid generic terms like "Cricket" or "Mario". Be precise and eBay-search-friendly.

Return only the JSON object in your response.`
            },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ]
        }],
        max_tokens: 1200
      });

      const text = completion.choices[0].message.content;
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const jsonString = text.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonString);

      // Overwrite item values using eBay sold listings
      for (let item of parsed.items) {
        const name = item.name.toLowerCase();
        if (name.includes("wii")) item.platform = "Wii";
        else if (name.includes("ps2")) item.platform = "PS2";
        else if (name.includes("xbox")) item.platform = "Xbox";
        else if (name.includes("ds")) item.platform = "Nintendo DS";
        else if (name.includes("blu-ray") || name.includes("bluray")) item.platform = "Blu-ray";
        else if (name.includes("dvd")) item.platform = "DVD";
        else if (name.includes("vhs") || name.includes("betamax")) item.platform = "VHS";
        else if (name.includes("record") || name.includes("vinyl")) item.platform = "Vinyl";
        else if (name.includes("antique") || name.includes("vintage")) item.platform = "";
        else item.platform = "-";
        item.source = 'gpt';
        item.note = 'NRS';
        const ebayValue = await getAverageSoldPrice(item.name);
        if (ebayValue !== null) {
          item.value = ebayValue;
          item.source = 'ebay';
          console.log(`✅ Used eBay value for '${item.name}': $${ebayValue}`);
        }
      }

      parsed.items.sort((a, b) => b.value - a.value);
      parsed.topItems = parsed.items.slice(0, 3);
      parsed.totalValue = parsed.items.reduce((sum, item) => sum + item.value, 0);

      res.status(200).json(parsed);
    } catch (e) {
      console.error("OpenAI or parsing error", e);
      res.status(500).json({ error: "Processing failed" });
    }
  });
}
