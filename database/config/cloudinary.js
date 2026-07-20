const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const cloudName  = process.env.CLOUDINARY_CLOUD_NAME  || process.env.cloud_name;
const apiKey     = process.env.CLOUDINARY_API_KEY      || process.env.api_key;
const apiSecret  = process.env.CLOUDINARY_API_SECRET   || process.env.api_secret;

const isCloudinaryConfigured = !!(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: cloudName,
        api_key:    apiKey,
        api_secret: apiSecret,
    });
    console.log("☁️ Cloudinary configured successfully. Cloud:", cloudName);
} else {
    console.log("⚠️ Cloudinary credentials missing. Falling back to Local Disk Storage (temporary on Render).");
}

/**
 * Upload a buffer to Cloudinary (if configured) or save to local disk public directory
 * @param {Buffer} buffer - File buffer
 * @param {string} subfolder - 'profiles' or 'resumes'
 * @param {string} originalName - Original filename (used for disk fallback)
 * @param {string} resourceType - 'image' or 'raw'
 * @returns {Promise<string>} File URL (Cloudinary absolute URL or local relative path)
 */
const uploadFile = (buffer, subfolder, originalName, resourceType = 'image') => {
    return new Promise((resolve, reject) => {
        if (isCloudinaryConfigured) {
            // Upload directly to Cloudinary
            const ext = path.extname(originalName);
            const baseName = path.parse(originalName).name;
            const uniqueId = `${baseName}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
            const pubId = resourceType === 'raw' ? `${uniqueId}${ext}` : uniqueId;

            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `placement-portal/${subfolder}`,
                    resource_type: resourceType,
                    public_id: pubId,
                    transformation: (resourceType === 'image' && subfolder === 'profiles')
                        ? [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
                        : undefined,
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url);
                }
            );
            uploadStream.end(buffer);
        } else {
            // Fallback: Save to local public/uploads directory
            try {
                const uploadDir = path.join(__dirname, '../../frontend/public/uploads', subfolder);
                
                // Ensure directory exists
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const ext = path.extname(originalName);
                const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
                const filePath = path.join(uploadDir, uniqueFilename);

                fs.writeFileSync(filePath, buffer);
                
                // Return local web URL path
                const localUrl = `/uploads/${subfolder}/${uniqueFilename}`;
                console.log(`💾 Saved file locally to ${localUrl}`);
                resolve(localUrl);
            } catch (err) {
                reject(err);
            }
        }
    });
};

module.exports = { cloudinary, uploadFile, isCloudinaryConfigured };
