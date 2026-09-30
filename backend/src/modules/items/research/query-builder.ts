import { VisualIdentification } from '../fashion.schema';

export interface GeneratedSearchQueries {
  primaryQuery: string;
  specificQuery: string;
  broadQuery: string;
  attributeQueries: string[];
  queryVariations: string[];
}

export class ResearchQueryBuilder {
  /**
   * Deterministically builds targeted, high-precision search query variations
   * from visual fashion attributes.
   * Strips null, undefined, and 'unknown' text to keep queries natural and clean.
   */
  static buildQueries(itemInfo: {
    title?: string | null;
    brand?: string | null;
    category?: string | null;
    garmentType?: string | null;
    color?: string | null;
    secondaryColors?: string[];
    pattern?: string | null;
    material?: string | null;
    fit?: string | null;
    style?: string | null;
    era?: string | null;
    productCode?: string | null;
    styleCode?: string | null;
    modelNumber?: string | null;
    distinctiveGraphics?: string[];
  }): GeneratedSearchQueries {
    const cleanWord = (w?: string | null): string => {
      if (!w) return '';
      const trimmed = w.trim();
      const lower = trimmed.toLowerCase();
      if (lower === 'null' || lower === 'undefined' || lower === 'unknown' || lower === 'none') {
        return '';
      }
      return trimmed;
    };

    const brand = cleanWord(itemInfo.brand);
    const garment = cleanWord(itemInfo.garmentType) || cleanWord(itemInfo.title) || cleanWord(itemInfo.category) || 'clothing';
    const color = cleanWord(itemInfo.color);
    const pattern = cleanWord(itemInfo.pattern);
    const material = cleanWord(itemInfo.material);
    const fit = cleanWord(itemInfo.fit);
    const style = cleanWord(itemInfo.style);
    const era = cleanWord(itemInfo.era);

    const productCode = cleanWord(itemInfo.productCode);
    const styleCode = cleanWord(itemInfo.styleCode);
    const modelNumber = cleanWord(itemInfo.modelNumber);
    const verifiedCode = productCode || styleCode || modelNumber;

    // Filter secondary colors
    const secondaryColors = (itemInfo.secondaryColors || [])
      .map(cleanWord)
      .filter((c) => Boolean(c) && c.toLowerCase() !== color.toLowerCase());

    // Exact Brand + Model / Code Queries (Highest Precision for Niche Items)
    const exactCodeQueries: string[] = [];
    if (verifiedCode) {
      if (brand) exactCodeQueries.push(`${brand} ${verifiedCode}`.trim());
      exactCodeQueries.push(verifiedCode);
      if (brand && garment) exactCodeQueries.push(`${brand} ${garment} ${verifiedCode}`.trim());
    }

    // Exact Brand + Garment / Model
    const brandModelTokens = [brand, garment].filter(Boolean);
    const brandModelQuery = brandModelTokens.join(' ').trim();

    // 1. Primary Query: If an exact code exists, prioritize Brand + Code + Garment; otherwise natural consumer product search
    let primaryQuery = '';
    if (verifiedCode && brand) {
      primaryQuery = `${brand} ${verifiedCode} ${garment}`.trim();
    } else {
      const primaryTokens = [
        brand,
        color,
        secondaryColors[0],
        pattern !== 'Solid' ? pattern : '',
        material,
        garment,
      ].filter(Boolean);
      primaryQuery = primaryTokens.join(' ').replace(/\s+/g, ' ').trim();
    }

    // 2. Specific Query: High-detail matching with material, fit, and distinctive graphics
    const graphicsToken = (itemInfo.distinctiveGraphics || []).map(cleanWord).filter(Boolean)[0] || '';
    const specificTokens = [
      brand,
      color,
      secondaryColors[0],
      pattern !== 'Solid' ? pattern : '',
      graphicsToken,
      fit,
      material,
      garment,
    ].filter(Boolean);
    const specificQuery = specificTokens.join(' ').replace(/\s+/g, ' ').trim();

    // 3. Broad Query: Fallback for generic exploration
    const broadTokens = [
      brand || color,
      garment,
    ].filter(Boolean);
    const broadQuery = broadTokens.join(' ').replace(/\s+/g, ' ').trim();

    // 4. Attribute Specific Queries: Useful for multi-pass searches
    const attributeQueries: string[] = [];
    if (brand && garment) {
      attributeQueries.push(`${brand} ${garment}`.trim());
    }
    if (color && garment) {
      attributeQueries.push(`${color} ${garment}`.trim());
    }
    if (material && garment) {
      attributeQueries.push(`${material} ${garment}`.trim());
    }
    if (pattern && pattern !== 'Solid' && garment) {
      attributeQueries.push(`${pattern} ${garment}`.trim());
    }

    // Deduplicated list of clean query variations for multi-query execution
    const queryVariations = Array.from(
      new Set(
        [
          ...exactCodeQueries,
          primaryQuery,
          brandModelQuery,
          specificQuery,
          broadQuery,
          ...attributeQueries,
          garment,
        ].filter(Boolean)
      )
    );

    return {
      primaryQuery: primaryQuery || brandModelQuery || garment,
      specificQuery: specificQuery || primaryQuery || garment,
      broadQuery: broadQuery || garment,
      attributeQueries,
      queryVariations,
    };
  }
}

