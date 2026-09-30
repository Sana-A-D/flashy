// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DefaultVisionRecognitionProvider } from './providers/vision-recognition.provider';

describe('DefaultVisionRecognitionProvider (Gemini AI Vision Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  it('throws PROVIDER_CONFIG_ERROR when GEMINI_API_KEY is missing', async () => {
    const provider = new DefaultVisionRecognitionProvider();
    const fakeBuffer = Buffer.from('fake-image-bytes');

    await expect(
      provider.analyzeImages([{ buffer: fakeBuffer, mimeType: 'image/jpeg' }])
    ).rejects.toThrow('PROVIDER_CONFIG_ERROR: Vision AI provider credentials missing.');
  });

  it('throws PROVIDER_CONFIG_ERROR when GEMINI_API_KEY is dummy', async () => {
    process.env.GEMINI_API_KEY = 'dummy';
    const provider = new DefaultVisionRecognitionProvider();
    const fakeBuffer = Buffer.from('fake-image-bytes');

    await expect(
      provider.analyzeImages([{ buffer: fakeBuffer, mimeType: 'image/jpeg' }])
    ).rejects.toThrow('PROVIDER_CONFIG_ERROR: Vision AI provider credentials missing.');
  });
});
