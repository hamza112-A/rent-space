const multer = require('multer');
const { validateFile } = require('../services/uploadService');
const ErrorResponse = require('../utils/errorResponse');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types based on field name
  const allowedTypes = {
    avatar: ['image/jpeg', 'image/png', 'image/webp'],
    images: ['image/jpeg', 'image/png', 'image/webp'],
    videos: ['video/mp4', 'video/mpeg', 'video/quicktime'],
    frontImage: ['image/jpeg', 'image/png', 'image/webp'],
    backImage: ['image/jpeg', 'image/png', 'image/webp'],
    selfieImage: ['image/jpeg', 'image/png', 'image/webp'],
    livenessVideo: ['video/mp4', 'video/mpeg', 'video/quicktime'],
    documents: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  };

  const fieldAllowedTypes = allowedTypes[file.fieldname] || allowedTypes.images;

  if (fieldAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ErrorResponse(`Invalid file type for ${file.fieldname}. Allowed types: ${fieldAllowedTypes.join(', ')}`, 400), false);
  }
};

// Create multer instance with configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: parseInt(process.env.MAX_FILES_PER_LISTING) || 10
  }
});

// Middleware for single file upload
const uploadSingle = (fieldName, options = {}) => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return next(new ErrorResponse('File too large', 400));
            case 'LIMIT_UNEXPECTED_FILE':
              return next(new ErrorResponse('Unexpected file field', 400));
            default:
              return next(new ErrorResponse(`Upload error: ${err.message}`, 400));
          }
        }
        return next(err);
      }

      // Validate file if present
      if (req.file) {
        const validation = validateFile(req.file, options);
        if (!validation.isValid) {
          return next(new ErrorResponse(`File validation failed: ${validation.errors.join(', ')}`, 400));
        }
      }

      next();
    });
  };
};

// Middleware for multiple files upload
const uploadMultiple = {
  // For array of files with same field name
  array: (fieldName, maxCount = 10, options = {}) => {
    return (req, res, next) => {
      const arrayUpload = upload.array(fieldName, maxCount);
      
      arrayUpload(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            switch (err.code) {
              case 'LIMIT_FILE_SIZE':
                return next(new ErrorResponse('File too large', 400));
              case 'LIMIT_FILE_COUNT':
                return next(new ErrorResponse(`Too many files. Maximum ${maxCount} allowed`, 400));
              case 'LIMIT_UNEXPECTED_FILE':
                return next(new ErrorResponse('Unexpected file field', 400));
              default:
                return next(new ErrorResponse(`Upload error: ${err.message}`, 400));
            }
          }
          return next(err);
        }

        // Validate files if present
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            const validation = validateFile(file, options);
            if (!validation.isValid) {
              return next(new ErrorResponse(`File validation failed: ${validation.errors.join(', ')}`, 400));
            }
          }
        }

        next();
      });
    };
  },

  // For multiple fields with different names
  fields: (fields, options = {}) => {
    return (req, res, next) => {
      const fieldsUpload = upload.fields(fields);
      
      fieldsUpload(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            switch (err.code) {
              case 'LIMIT_FILE_SIZE':
                return next(new ErrorResponse('File too large', 400));
              case 'LIMIT_FILE_COUNT':
                return next(new ErrorResponse('Too many files', 400));
              case 'LIMIT_UNEXPECTED_FILE':
                return next(new ErrorResponse('Unexpected file field', 400));
              default:
                return next(new ErrorResponse(`Upload error: ${err.message}`, 400));
            }
          }
          return next(err);
        }

        // Validate files if present
        if (req.files) {
          for (const fieldName in req.files) {
            const files = req.files[fieldName];
            for (const file of files) {
              const validation = validateFile(file, options);
              if (!validation.isValid) {
                return next(new ErrorResponse(`File validation failed for ${fieldName}: ${validation.errors.join(', ')}`, 400));
              }
            }
          }
        }

        next();
      });
    };
  },

  // Single file upload
  single: (fieldName, options = {}) => uploadSingle(fieldName, options),

  // No file upload (for form data only)
  none: () => upload.none()
};

// Specific upload configurations for different use cases
const uploadConfigs = {
  // Avatar upload configuration
  avatar: uploadSingle('avatar', {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
  }),

  // Listing images upload configuration
  listingImages: uploadMultiple.array('images', 10, {
    maxSize: 5 * 1024 * 1024, // 5MB per image
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
  }),

  // Listing videos upload configuration
  listingVideos: uploadMultiple.array('videos', 2, {
    maxSize: 50 * 1024 * 1024, // 50MB per video
    allowedTypes: ['video/mp4', 'video/mpeg', 'video/quicktime'],
    allowedExtensions: ['.mp4', '.mpeg', '.mov']
  }),

  // ID document upload configuration
  idDocuments: uploadMultiple.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
  ], {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
  }),

  // Biometric verification upload configuration
  biometric: uploadMultiple.fields([
    { name: 'selfieImage', maxCount: 1 },
    { name: 'livenessVideo', maxCount: 1 }
  ], {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/mpeg', 'video/quicktime'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mpeg', '.mov']
  })
};

// Error handling middleware for multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return next(new ErrorResponse('File size too large', 400));
      case 'LIMIT_FILE_COUNT':
        return next(new ErrorResponse('Too many files uploaded', 400));
      case 'LIMIT_FIELD_KEY':
        return next(new ErrorResponse('Field name too long', 400));
      case 'LIMIT_FIELD_VALUE':
        return next(new ErrorResponse('Field value too long', 400));
      case 'LIMIT_FIELD_COUNT':
        return next(new ErrorResponse('Too many fields', 400));
      case 'LIMIT_UNEXPECTED_FILE':
        return next(new ErrorResponse('Unexpected file field', 400));
      default:
        return next(new ErrorResponse(`Upload error: ${err.message}`, 400));
    }
  }
  next(err);
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadConfigs,
  handleUploadError
};