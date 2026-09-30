import { GoogleGenAI } from '@google/genai';
import {
  VisualIdentification,
  StyleIdea,
  FashionTerminology,
  BuyerProfile,
  MarketplaceSuitability,
  FashionListingDraft,
} from './fashion.schema';

export interface FashionVisualAnalysisResult {
  identification: VisualIdentification;
  terminology: FashionTerminology;
  buyerProfile: BuyerProfile;
  marketplaces: MarketplaceSuitability[];
  listing: FashionListingDraft;
  styleIdeas: StyleIdea[];
}

export class FashionVisionService {
  async analyzeFashionImages(
    imageBuffers: { buffer: Buffer; mimeType: string }[]
  ): Promise<FashionVisualAnalysisResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'dummy') {
      throw new Error('PROVIDER_CONFIG_ERROR: Vision AI provider credentials missing.');
    }

    // Configurable model name with fallback to free-tier flash-lite or 3.8-flash
    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    const ai = new GoogleGenAI({ apiKey });

    const parts: any[] = imageBuffers.map((img) => ({
      inlineData: {
        data: img.buffer.toString('base64'),
        mimeType: img.mimeType,
      },
    }));

    parts.push({
      text: `You are the rigorous fashion intelligence & visual identification engine of FLASHY ("Know what you're wearing.").
IMPORTANT: All provided images depict the SAME ONE physical fashion item from multiple angles and views (e.g. front view, back view, close-up of collar/neck label, care tags, fabric weave, distinctive stitching, hardware, embroidery, or SKU/product codes). Combine evidence across ALL images into ONE unified fashion identification.

CRITICAL EVIDENCE-BASED IDENTIFICATION RULES:
1. Treat identification as an EVIDENCE-BASED investigation. Never invent or hallucinate a brand, exact model name, or product code.
2. Distinguish strictly between:
   - "OBSERVED": Directly visible in at least one image (e.g. clear woven label, readable RN#, screenprinted text, visible SKU code).
   - "INFERRED": Highly likely deduced from design architecture (e.g. stitch pattern, fabric weight).
   - "UNKNOWN": Cannot be verified visually. Set to null or "UNKNOWN".
3. Extract ALL visible textual clues:
   - productCode: visible SKU / style code / model number (e.g. "501-0115", "CW2288-111", "RN 12345", "CA 54321") or null.
   - visibleLabels: list of labels seen (e.g. ["Woven neck tag", "Care instruction tag", "Pocket tab"]).
   - extractedText: exact OCR text read from tags, labels, or graphics.
   - distinctiveGraphics: logos, embroidery, patches, screenprints.
   - hardware: e.g. "YKK zipper", "branded doughnut buttons", "silver rivets", or null.
   - collarNeckline, sleeveType, closureType, pockets, stitching: exact construction observed.
4. IDENTIFICATION CONFIDENCE TIERING:
   - "EXACT_MATCH": Supported by clear readable product name, verified SKU/model code, or unmistakable brand label + unique model design.
   - "STRONG_MATCH": Known brand confirmed from clear logo/tag with strong silhouette/pattern match, but exact seasonal model code not confirmed.
   - "CLOSE_MATCH": Specific garment silhouette and styling identified, brand inferred or unconfirmed.
   - "CATEGORY_ONLY": Generic or unbranded garment (e.g. "Striped Cotton Polo Shirt", "Pleated Chino Trousers").
   - "UNKNOWN": Image too blurry or insufficient to determine garment type.
   If exact model cannot be verified, set exactModelVerified: false and verifiedProductName: null. NEVER claim exact match merely on vague visual resemblance.

STYLE & OUTFIT GROUNDING (LOCKED SCANNED ITEM):
5. When generating outfit recommendations (styleIdeas):
   - The user's scanned garment is STRICTLY LOCKED as the primary anchor.
   - Do NOT redesign, replace, or alter the scanned item's color, stripes, pattern, collar, sleeves, or category.
   - Recommend 4 to 6 genuinely distinct, useful outfits tailored specifically for this item (e.g. Casual, Clean / Smart Casual, Streetwear, Date / Evening, Summer / Warm Weather, Work).
   - Each outfit must clearly specify the locked scanned item in pieces and breakdown with isScannedItem: true.
   - Include realistic search queries for companion pieces and a structured image prompt describing the locked scanned item paired with the companion pieces.

Return ONLY a valid JSON object matching this structure:
{
  "identification": {
    "category": "Broad category e.g. Tops, Bottoms, Outerwear, Footwear, Accessories, or null",
    "garmentType": "Specific garment description e.g. Navy Blue Breton Stripe Cotton Polo Shirt, or null",
    "subcategory": "e.g. Short-Sleeve Polo Shirt, Straight Leg Jeans, or null",
    "itemType": "e.g. Casual Polo, Chore Coat, or null",
    "intendedUse": "e.g. Casual everyday wear, Smart casual, Sportswear, or null",
    "color": "Dominant color e.g. Navy Blue",
    "secondaryColors": ["White", "Gold"],
    "colorFamily": "e.g. Blue, Earth Tones, Monochrome, or null",
    "pattern": "e.g. Horizontal Stripe, Solid, Floral, Plaid, Houndstooth, or null",
    "material": "e.g. Cotton pique, 100% Cotton, Heavyweight jersey, or null",
    "materialBasis": "OBSERVED" or "INFERRED" or "UNKNOWN",
    "fit": "e.g. Regular fit, Relaxed fit, Slim fit, Boxy, or null",
    "silhouette": "e.g. Straight, Cropped, Oversized, or null",
    "style": "e.g. Preppy, Minimalist, Streetwear, Workwear, or null",
    "aesthetics": ["Nautical", "Smart Casual", "Classic"],
    "season": "e.g. Spring/Summer, Fall/Winter, All-season, or null",
    "genderPresentation": "e.g. Unisex, Menswear, Womenswear, or null",
    
    "possibleBrand": "Verified brand from label/logo or null",
    "brandEvidence": "Exact visual basis e.g. 'Stitched woven label reads Ralph Lauren' or null",
    "brandBasis": "OBSERVED" or "INFERRED" or "UNKNOWN",
    "brandConfidence": "HIGH" or "MEDIUM" or "LOW",
    
    "productCode": "Readable style code / SKU / model / RN number or null",
    "styleCode": "Specific style code if printed or null",
    "modelNumber": "Model number or null",
    "extractedText": ["Any readable text found on tags or garment"],
    "visibleLabels": ["Neck brand tag", "Care tag"],
    "distinctiveGraphics": ["Embroidered pony logo on left chest"],
    "hardware": "e.g. 2-button mother-of-pearl placket, or null",
    "collarNeckline": "e.g. Ribbed polo collar with collar band, or null",
    "sleeveType": "e.g. Short sleeves with ribbed armbands, or null",
    "closureType": "e.g. 2-button half-placket, or null",
    "pockets": "e.g. None, or Patch chest pocket",
    "stitching": "e.g. Clean double-needle hem, or null",
    "countryOfManufacture": "e.g. Made in Portugal, or null",
    
    "identificationLevel": "EXACT_MATCH" or "STRONG_MATCH" or "CLOSE_MATCH" or "CATEGORY_ONLY" or "UNKNOWN",
    "exactModelVerified": false,
    "verifiedProductName": null,
    "identificationNotes": "Factual summary of verified evidence vs unconfirmed model details",

    "possibleEra": "e.g. 1990s, Y2K, Contemporary, or null",
    "eraConfidence": "HIGH" or "MEDIUM" or "LOW",
    "condition": "e.g. Pre-owned Excellent, Lightly Worn, or null",
    "conditionAssessment": "Visual physical state of fabric, seams, collar, buttons",
    "visibleFlaws": [],
    "distinctiveFeatures": ["Horizontal striped knit", "Contrast collar"],
    "constructionDetails": ["Pique knit texture", "Side vent hem"],
    "confidence": 0.88,
    "notes": "Evidence-grounded identification summary"
  },
  "terminology": {
    "primarySearchPhrase": "High-precision search phrase using verified brand/code or specific traits",
    "alternativeSearchPhrases": ["alternative phrase 1", "alternative phrase 2"],
    "fashionTerminology": ["polo shirt", "pique knit", "breton stripe"],
    "buyerFacingTerminology": ["striped polo", "cotton casual shirt"],
    "resellerTerminology": ["vintage polo", "preppy top"],
    "marketplaceKeywords": ["polo", "striped", "cotton", "menswear"],
    "longTailKeywords": ["navy white horizontal stripe polo shirt cotton"],
    "tags": ["polo", "casual", "smartcasual"]
  },
  "buyerProfile": {
    "buyerTypes": ["Classic casual shoppers", "Preppy enthusiasts"],
    "useCases": ["Weekend wear", "Casual office", "Summer outings"],
    "searchIntent": ["Looking for versatile striped polo shirt"],
    "stylePreferences": ["Clean classic wardrobe staples"],
    "seasonalDemand": "Spring and Summer"
  },
  "marketplaces": [
    {
      "marketplace": "eBay",
      "relevance": "HIGH",
      "fitReason": "High volume category for brand and style searches",
      "recommendedPositioning": "Highlight exact condition, material, and chest measurements",
      "keywords": ["polo", "casual", "apparel"],
      "pricingConsiderations": "Competitive buy-it-now with clear condition photos"
    }
  ],
  "listing": {
    "title": "Clear factual title (Brand + Key Attributes + Garment)",
    "description": "Accurate description detailing cut, fabric, collar, condition, and measurements.",
    "keywords": ["polo", "shirt", "cotton"],
    "tags": ["top", "casual", "striped"],
    "attributeFields": {
      "Category": "Tops",
      "Color": "Navy Blue",
      "Material": "Cotton"
    }
  },
  "styleIdeas": [
    {
      "id": "look-01",
      "title": "Casual",
      "aesthetic": "Everyday Relaxed",
      "description": "Scanned garment anchored with relaxed straight-leg blue jeans, clean white sneakers, and a minimal watch.",
      "whyItWorks": "The relaxed denim balances the structured garment while keeping the color palette effortless and neutral.",
      "pieces": ["YOUR SCANNED ITEM", "Relaxed straight-leg blue jeans", "Clean low-profile white sneakers", "Minimal silver watch"],
      "breakdown": [
        { "category": "Scanned Item", "label": "YOUR SCANNED ITEM", "isScannedItem": true },
        { "category": "Bottom", "label": "Relaxed straight-leg blue jeans", "isScannedItem": false, "searchQuery": "relaxed straight leg denim jeans" },
        { "category": "Shoes", "label": "Clean low-profile white sneakers", "isScannedItem": false, "searchQuery": "white low profile sneakers" },
        { "category": "Accessories", "label": "Minimal silver wrist watch", "isScannedItem": false, "searchQuery": "minimalist silver watch" }
      ],
      "colors": ["Navy", "White", "Light Denim"],
      "occasion": "Casual",
      "season": "All Season",
      "imagePrompt": "Editorial flat-lay fashion photograph featuring the exact scanned garment prominently in the center, paired with relaxed blue denim jeans and white sneakers on a neutral surface."
    },
    {
      "id": "look-02",
      "title": "Clean / Smart Casual",
      "aesthetic": "Refined Tailoring",
      "description": "Scanned garment paired with tailored neutral pleated trousers, classic leather loafers, and a slim leather belt.",
      "whyItWorks": "Structured trousers elevate the silhouette for dinner, social events, or a polished workplace.",
      "pieces": ["YOUR SCANNED ITEM", "Beige pleated trousers", "Leather penny loafers", "Cognac leather belt"],
      "breakdown": [
        { "category": "Scanned Item", "label": "YOUR SCANNED ITEM", "isScannedItem": true },
        { "category": "Bottom", "label": "Beige pleated trousers", "isScannedItem": false, "searchQuery": "pleated beige trousers" },
        { "category": "Shoes", "label": "Brown leather loafers", "isScannedItem": false, "searchQuery": "leather penny loafers" },
        { "category": "Accessories", "label": "Cognac leather belt", "isScannedItem": false, "searchQuery": "cognac leather belt" }
      ],
      "colors": ["Cream", "Navy", "Cognac Brown"],
      "occasion": "Work",
      "season": "Spring / Fall",
      "imagePrompt": "Editorial fashion photography featuring the exact scanned garment paired with beige pleated trousers and brown leather loafers."
    },
    {
      "id": "look-03",
      "title": "Streetwear",
      "aesthetic": "Modern Urban",
      "description": "Scanned garment layered with wide-leg utility trousers, chunky retro runners, and a compact crossbody bag.",
      "whyItWorks": "Exaggerated proportions and functional technical accessories lend an effortless contemporary edge.",
      "pieces": ["YOUR SCANNED ITEM", "Wide-leg black utility trousers", "Chunky retro runners", "Nylon crossbody bag"],
      "breakdown": [
        { "category": "Scanned Item", "label": "YOUR SCANNED ITEM", "isScannedItem": true },
        { "category": "Bottom", "label": "Wide-leg black utility pants", "isScannedItem": false, "searchQuery": "wide leg black utility pants" },
        { "category": "Shoes", "label": "Chunky retro runners", "isScannedItem": false, "searchQuery": "retro runner sneakers" },
        { "category": "Accessories", "label": "Nylon crossbody bag", "isScannedItem": false, "searchQuery": "nylon crossbody bag" }
      ],
      "colors": ["Black", "Graphite", "White"],
      "occasion": "Weekend",
      "season": "All Season",
      "imagePrompt": "Editorial streetwear styling featuring the exact scanned garment anchored with wide-leg black trousers and technical accessories."
    },
    {
      "id": "look-04",
      "title": "Summer / Warm Weather",
      "aesthetic": "Resort Casual",
      "description": "Scanned garment paired with crisp cream linen-blend shorts, canvas sneakers, and acetate sunglasses.",
      "whyItWorks": "Breathable fabrics and light neutral tones highlight the item for warm days and travel.",
      "pieces": ["YOUR SCANNED ITEM", "Cream linen-blend shorts", "Low-top canvas sneakers", "Tortoise acetate sunglasses"],
      "breakdown": [
        { "category": "Scanned Item", "label": "YOUR SCANNED ITEM", "isScannedItem": true },
        { "category": "Bottom", "label": "Cream linen shorts", "isScannedItem": false, "searchQuery": "cream linen blend shorts" },
        { "category": "Shoes", "label": "Canvas sneakers", "isScannedItem": false, "searchQuery": "canvas deck sneakers" },
        { "category": "Accessories", "label": "Tortoiseshell sunglasses", "isScannedItem": false, "searchQuery": "tortoise acetate sunglasses" }
      ],
      "colors": ["Cream", "Off-White", "Tan"],
      "occasion": "Travel",
      "season": "Summer",
      "imagePrompt": "Sunny resort style editorial featuring the exact scanned garment paired with light cream shorts and canvas sneakers."
    }
  ]
}`
    });

    let response: any;
    try {
      response = await ai.models.generateContent({
        model,
        contents: parts,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
    } catch (apiErr: any) {
      // If configured model fails (e.g. 404, 503, or quota), try resilient working alternatives
      const fallbacks = ['gemini-3.1-flash-lite', 'gemini-3.5-flash'];
      let lastErr = apiErr;
      for (const fallbackModel of fallbacks) {
        if (fallbackModel === model) continue;
        try {
          console.warn(`[FashionVisionService] Model ${model} failed, trying ${fallbackModel}...`);
          response = await ai.models.generateContent({
            model: fallbackModel,
            contents: parts,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });
          break;
        } catch (fbErr: any) {
          lastErr = fbErr;
        }
      }
      if (!response) {
        throw lastErr;
      }
    }

    const text = response.text;
    if (!text) {
      throw new Error('AI returned no text');
    }

    try {
      let jsonText = text.trim();
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      } else {
        jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
      }
      const parsed = JSON.parse(jsonText);
      return parsed as FashionVisualAnalysisResult;
    } catch (e: any) {
      throw new Error(`Failed to parse fashion AI response: ${e.message || text}`);
    }
  }
}

export const fashionVisionService = new FashionVisionService();
