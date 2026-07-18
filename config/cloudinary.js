const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary credentials missing! Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your environment variables.');
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for profile images
const profileStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder:         'placement-portal/profiles',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    },
});

// Storage for PDF resumes
const resumeStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder:         'placement-portal/resumes',
        allowed_formats: ['pdf'],
        resource_type:  'raw',          // required for non-image files
    },
});

module.exports = { cloudinary, profileStorage, resumeStorage };
