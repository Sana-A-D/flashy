// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { AIStructuredAttributesSchema } from './item-recognition.schema';

describe('AIStructuredAttributesSchema (Visual AI Intake Fact vs Inference Validation)', () => {
  it('validates structured recognition output with observed facts and defaults unknown fields to null/empty', () => {
    const validData = {
      brand: 'Nike',
      model: 'Air Max 90',
      category: 'Footwear',
      color: 'Black/Infrared',
      era: '90s',
      distinctiveFeatures: ['Waffle outsole', 'Visible Max Air unit'],
      confidence: 0.95,
      // Unobserved fields are omitted or null
      sku: null,
      upc: null,
      size: null,
    };

    const parsed = AIStructuredAttributesSchema.parse(validData);
    expect(parsed.brand).toBe('Nike');
    expect(parsed.model).toBe('Air Max 90');
    expect(parsed.era).toBe('90s');
    expect(parsed.distinctiveFeatures).toHaveLength(2);
    expect(parsed.sku).toBeNull();
    expect(parsed.size).toBeNull();
    expect(parsed.secondaryColors).toEqual([]);
    expect(parsed.conditionClues).toEqual([]);
  });

  it('preserves null and undefined for unverified attributes without fabricating values', () => {
    const minimalData = {
      productName: 'Vintage Denim Jacket',
    };

    const parsed = AIStructuredAttributesSchema.parse(minimalData);
    expect(parsed.productName).toBe('Vintage Denim Jacket');
    expect(parsed.brand).toBeUndefined();
    expect(parsed.model).toBeUndefined();
    expect(parsed.era).toBeUndefined();
    expect(parsed.modelNumber).toBeUndefined();
  });

  it('rejects invalid confidence scores outside [0, 1]', () => {
    const invalidData = {
      brand: 'Nike',
      confidence: 1.5,
    };

    expect(() => AIStructuredAttributesSchema.parse(invalidData)).toThrow();
  });
});
