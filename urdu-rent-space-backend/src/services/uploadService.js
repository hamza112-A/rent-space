const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadToCloudinary = async (fileBuffer, options = {}) => {
  try {
    const {
      folder = 'uploads',
      width,
      height,
      crop = 'limit',
      quality = 'auto',
      format = 'auto',
      resource_type = 'auto'
    } = options;

    // Optimize image if it's an image
    let processedBuffer = fileBuffer;
    if (resource_type === 'image' || resource_type === 'auto') {
      try {
        processedBuffer = await sharp(fileBuffer)
          .resize(width, height, { 
            fit: crop === 'fill' ? 'cover' : 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toBuffer();
      } catch (error) {
        // If sharp processing fails, use original buffer
        console.warn('Image processing failed, using original:', error.message);
      }
    }

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        resource_type,
        quality,
        format,
        ...(width && height && { 
          transformation: [
            { width, height, crop }
          ]
        })
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(processedBuffer);
    });

  } catch (error) {
    throw new Error(`Upload service error: ${error.message}`);
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @param {string} resourceType - Type of resource (image, video, raw)
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });

    if (result.result !== 'ok') {
      throw new Error(`Failed to delete file: ${result.result}`);
    }

    return result;
  } catch (error) {
    throw new Error(`Delete service error: ${error.message}`);
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array} files - Array of file buffers
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} Array of upload results
 */
const uploadMultipleToCloudinary = async (files, options = {}) => {
  try {
    const uploadPromises = files.map((file, index) => 
      uploadToCloudinary(file.buffer, {
        ...options,
        folder: `${options.folder || 'uploads'}`,
        public_id: options.public_id ? `${options.public_id}_${index}` : undefined
      })
    );

    return await Promise.all(uploadPromises);
  } catch (error) {
    throw new Error(`Multiple upload service error: ${error.message}`);
  }
};

/**
 * Generate thumbnail for video
 * @param {string} videoPublicId - Public ID of the video
 * @param {Object} options - Thumbnail options
 * @returns {Promise<Object>} Thumbnail result
 */
const generateVideoThumbnail = async (videoPublicId, options = {}) => {
  try {
    const {
      width = 300,
      height = 200,
      crop = 'fill',
      format = 'jpg'
    } = options;

    const thumbnailUrl = cloudinary.url(videoPublicId, {
      resource_type: 'video',
      format,
      transformation: [
        { width, height, crop },
        { flags: 'attachment' }
      ]
    });

    return {
      url: thumbnailUrl,
      public_id: `${videoPublicId}_thumbnail`
    };
  } catch (error) {
    throw new Error(`Thumbnail generation error: ${error.message}`);
  }
};

/**
 * Get file info from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resourceType - Type of resource
 * @returns {Promise<Object>} File info
 */
const getFileInfo = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height,
      created_at: result.created_at
    };
  } catch (error) {
    throw new Error(`Get file info error: ${error.message}`);
  }
};

/**
 * Validate file before upload
 * @param {Object} file - File object from multer
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  } = options;

  const errors = [];

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`);
  }

  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} is not allowed`);
  }

  // Check file extension
  const fileExtension = '.' + file.originalname.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push(`File extension ${fileExtension} is not allowed`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate optimized image URL
 * @param {string} publicId - Public ID of the image
 * @param {Object} options - Transformation options
 * @returns {string} Optimized image URL
 */
const getOptimizedImageUrl = (publicId, options = {}) => {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop, quality, format }
    ]
  });
};

/**
 * Test Cloudinary configuration
 * @returns {Promise<Object>} Test result
 */
const testCloudinaryConfig = async () => {
  try {
    const result = await cloudinary.api.ping();
    return {
      success: true,
      message: 'Cloudinary configuration is valid',
      status: result.status
    };
  } catch (error) {
    return {
      success: false,
      message: `Cloudinary configuration error: ${error.message}`
    };
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadMultipleToCloudinary,
  generateVideoThumbnail,
  getFileInfo,
  validateFile,
  getOptimizedImageUrl,
  testCloudinaryConfig
};