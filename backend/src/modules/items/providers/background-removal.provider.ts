export interface BackgroundRemovalProvider {
  removeBackground(imageBuffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string }>;
}

export class DefaultBackgroundRemovalProvider implements BackgroundRemovalProvider {
  async removeBackground(imageBuffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const apiKey = process.env.BG_REMOVAL_API_KEY;
    if (!apiKey || apiKey === 'dummy') {
      throw new Error('PROVIDER_CONFIG_ERROR: Background-removal provider credentials missing.');
    }

    // This is where a real provider like remove.bg would be called.
    // Since we don't have one, we throw the config error above if no real key is set.
    throw new Error('PROVIDER_NOT_IMPLEMENTED');
  }
}

export const backgroundRemovalProvider = new DefaultBackgroundRemovalProvider();
