import { GoogleGenAI } from '@google/genai';
import { AIStructuredAttributes } from '../item-recognition.schema';

export interface VisionRecognitionProvider {
  analyzeImages(imageBuffers: { buffer: Buffer; mimeType: string }[]): Promise<AIStructuredAttributes>;
}

export class DefaultVisionRecognitionProvider implements VisionRecognitionProvider {
  async analyzeImages(imageBuffers: { buffer: Buffer; mimeType: string }[]): Promise<AIStructuredAttributes> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'dummy') {
      throw new Error('PROVIDER_CONFIG_ERROR: Vision AI provider credentials missing.');
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Prepare parts
    const parts: any[] = imageBuffers.map(img => ({
      inlineData: {
        data: img.buffer.toString("base64"),
        mimeType: img.mimeType
      }
    }));
    
    parts.push({
      text: `Analyze all provided images of this physical item being prepared for resale (front, back, brand tags, care labels, soles, logos, or defects).
Reason across ALL provided images to identify verified facts versus cautious inferences.
Return ONLY a valid JSON object matching this structure. Do NOT hallucinate. If a detail cannot be determined or is uncertain, return null.

{
  "category": "Broad category like 'Sneakers', 'Outerwear', 'Electronics', or null",
  "brand": "Brand name visible on logos or tags, or null if unverified",
  "model": "Specific model only if identifiable with high/medium confidence from markings or design, else null",
  "productName": "Concise verified product title",
  "color": "Dominant color",
  "secondaryColors": ["list", "of", "accent", "colors"],
  "material": "Material stated on care tags or clearly visible, or null",
  "era": "Estimated era/decade if vintage or distinctive (e.g., '1990s', 'Y2K / 2000s', 'Contemporary'), or null if unverified",
  "style": "Style classification (e.g. 'Athletic streetwear', 'Vintage 90s sportswear', 'Casual workwear')",
  "audience": "Target demographic: 'Men', 'Women', 'Unisex', 'Kids', or null",
  "size": "Size exactly as printed on tags/labels, or null if not shown",
  "pattern": "Pattern (e.g. 'Solid', 'Striped', 'Floral', 'Colorblock'), or null",
  "conditionClues": ["List visible facts: e.g. 'Tag attached', 'Minor scuff on left heel', 'Clean sole'"],
  "visibleFeatures": ["List visible features: e.g. 'Embroidered swoosh', 'Zippered pockets'"],
  "distinctiveFeatures": ["Key resale identifiers: e.g. 'Single stitch hem', 'Made in USA tag', 'Embroidered spellout'"],
  "modelNumber": "Style/model code from tag if visible, or null",
  "sku": "UPC or SKU from barcode tag if readable, or null",
  "upc": null,
  "confidence": 0.0 to 1.0, // Numeric confidence: 0.9+ for clear tags/logos, 0.6-0.8 for strong visual match, <0.6 for generic/uncertain
  "notes": "Evidence summary: specify what was confirmed via tags vs visual inference vs uncertain details"
}`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: parts,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI returned no text');
    }

    try {
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(cleanJson);
      return parsed as AIStructuredAttributes;
    } catch (e) {
      throw new Error(`Failed to parse AI response: ${text}`);
    }
  }
}

export const visionRecognitionProvider = new DefaultVisionRecognitionProvider();

