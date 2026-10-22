import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env variables are loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'ptoapvib';
const apiKey = process.env.CLOUDINARY_API_KEY || '958561948832798';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'FSWYolgz0FFmVVodDyvfouU7gbE';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export { cloudinary };

/**
 * Uploads a local file or buffer to Cloudinary
 * @param filePath Full path to the file on disk
 * @param folder Cloudinary folder to organize assets
 */
export async function uploadToCloudinary(filePath: string, folder = 'charvik_fleet') {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto', // supports jpg, png, webp, pdf, etc.
      use_filename: true,
      unique_filename: true,
    });
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}
