import QRCode from 'qrcode';

export interface QrOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generates a high-resolution, standards-compliant PNG Data URL for a given URL or text.
 * Uses high error correction (Level H) so mobile phone cameras can scan it instantly.
 */
export async function generateQrDataUrl(
  text: string,
  options: QrOptions = {}
): Promise<string> {
  const {
    width = 480,
    margin = 1,
    darkColor = '#0c0a09',
    lightColor = '#ffffff',
    errorCorrectionLevel = 'H',
  } = options;

  try {
    return await QRCode.toDataURL(text, {
      width,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel,
    });
  } catch (err) {
    console.error('Failed to generate QR code data URL:', err);
    return '';
  }
}
