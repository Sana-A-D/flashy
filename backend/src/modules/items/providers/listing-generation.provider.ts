import { GoogleGenAI } from '@google/genai';
import { GeneratedListingDraft } from '../listing-generation.schema';

export interface ListingGenerationProvider {
  generateListing(itemData: any, recognitionData: any): Promise<GeneratedListingDraft>;
}

export class DefaultListingGenerationProvider implements ListingGenerationProvider {
  async generateListing(itemData: any, recognitionData: any): Promise<GeneratedListingDraft> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'dummy') {
      throw new Error('PROVIDER_CONFIG_ERROR: Listing generation AI provider credentials missing.');
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const promptText = `
You are an expert reseller assistant. Your task is to generate a professional marketplace-ready listing draft.
Use ONLY the provided facts. DO NOT hallucinate exact model numbers, materials, conditions, measurements, or features that are not explicitly stated or clearly visible.
If a detail is uncertain, omit it or describe it cautiously (e.g., instead of '100% genuine leather', use 'leather-like finish' if unsupported).

User Item Data (Source of Truth):
${JSON.stringify(itemData, null, 2)}

AI Recognition Data:
${JSON.stringify(recognitionData, null, 2)}

Return ONLY a valid JSON object matching this exact structure:
{
  "title": "A concise, searchable title (Brand + Product + Key Attribute + Size/Style)",
  "description": "A clear, scanable, factual description useful to buyers.",
  "category": "Broad category",
  "brand": "Brand name if known",
  "condition": "Condition based on user data or cautious inference",
  "color": "Primary color",
  "size": "Size if known",
  "attributes": { "key": "value" },
  "keywords": ["keyword1", "keyword2"]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ text: promptText }],
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
      return parsed as GeneratedListingDraft;
    } catch (e) {
      throw new Error(`Failed to parse AI response: ${text}`);
    }
  }
}

export const listingGenerationProvider = new DefaultListingGenerationProvider();
