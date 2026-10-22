export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'ptoapvib',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '958561948832798',
};

/**
 * Helper to build optimized Cloudinary URLs
 */
export function getOptimizedImageUrl(publicIdOrUrl: string, options: { width?: number; height?: number; crop?: string } = {}) {
  if (!publicIdOrUrl) return '';
  if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
    return publicIdOrUrl;
  }
  const { width, height, crop = 'fill' } = options;
  const transformations = [
    'f_auto',
    'q_auto',
    width ? `w_${width}` : '',
    height ? `h_${height}` : '',
    crop ? `c_${crop}` : '',
  ].filter(Boolean).join(',');

  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transformations}/${publicIdOrUrl}`;
}
