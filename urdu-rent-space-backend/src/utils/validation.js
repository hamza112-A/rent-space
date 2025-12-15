const validator = require('validator');

/**
 * Validate input data against rules
 * @param {Object} data - Object containing field names and their validation rules
 * @returns {Object} Validation result with isValid boolean and errors object
 */
const validateInput = (data) => {
  const errors = {};
  let isValid = true;

  for (const [field, config] of Object.entries(data)) {
    const { value, rules } = config;
    const fieldErrors = [];

    for (const rule of rules) {
      const error = validateField(value, rule, field);
      if (error) {
        fieldErrors.push(error);
        isValid = false;
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }

  return { isValid, errors };
};

/**
 * Validate a single field against a rule
 * @param {any} value - Value to validate
 * @param {string} rule - Validation rule
 * @param {string} field - Field name for error messages
 * @returns {string|null} Error message or null if valid
 */
const validateField = (value, rule, field) => {
  // Handle rule with parameters (e.g., 'min:8', 'max:100')
  const [ruleName, ruleParam] = rule.split(':');

  switch (ruleName) {
    case 'required':
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return `${field} is required`;
      }
      break;

    case 'string':
      if (value && typeof value !== 'string') {
        return `${field} must be a string`;
      }
      break;

    case 'number':
      if (value && !validator.isNumeric(value.toString())) {
        return `${field} must be a number`;
      }
      break;

    case 'email':
      if (value && !validator.isEmail(value)) {
        return `${field} must be a valid email address`;
      }
      break;

    case 'phone':
      if (value && !isValidPakistaniPhone(value)) {
        return `${field} must be a valid Pakistani phone number (+92xxxxxxxxxx)`;
      }
      break;

    case 'url':
      if (value && !validator.isURL(value)) {
        return `${field} must be a valid URL`;
      }
      break;

    case 'min':
      if (value) {
        const minValue = parseInt(ruleParam);
        if (typeof value === 'string' && value.length < minValue) {
          return `${field} must be at least ${minValue} characters long`;
        }
        if (typeof value === 'number' && value < minValue) {
          return `${field} must be at least ${minValue}`;
        }
      }
      break;

    case 'max':
      if (value) {
        const maxValue = parseInt(ruleParam);
        if (typeof value === 'string' && value.length > maxValue) {
          return `${field} must not exceed ${maxValue} characters`;
        }
        if (typeof value === 'number' && value > maxValue) {
          return `${field} must not exceed ${maxValue}`;
        }
      }
      break;

    case 'in':
      if (value) {
        const allowedValues = ruleParam.split(',');
        if (!allowedValues.includes(value)) {
          return `${field} must be one of: ${allowedValues.join(', ')}`;
        }
      }
      break;

    case 'alpha':
      if (value && !validator.isAlpha(value)) {
        return `${field} must contain only letters`;
      }
      break;

    case 'alphanumeric':
      if (value && !validator.isAlphanumeric(value)) {
        return `${field} must contain only letters and numbers`;
      }
      break;

    case 'date':
      if (value && !validator.isISO8601(value)) {
        return `${field} must be a valid date`;
      }
      break;

    case 'boolean':
      if (value !== undefined && typeof value !== 'boolean') {
        return `${field} must be a boolean`;
      }
      break;

    case 'array':
      if (value && !Array.isArray(value)) {
        return `${field} must be an array`;
      }
      break;

    case 'object':
      if (value && typeof value !== 'object') {
        return `${field} must be an object`;
      }
      break;

    case 'password':
      if (value && !isValidPassword(value)) {
        return `${field} must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number`;
      }
      break;

    case 'cnic':
      if (value && !isValidCNIC(value)) {
        return `${field} must be a valid CNIC number (xxxxx-xxxxxxx-x)`;
      }
      break;

    case 'coordinates':
      if (value && !isValidCoordinates(value)) {
        return `${field} must be valid coordinates [longitude, latitude]`;
      }
      break;

    default:
      // Unknown rule, skip validation
      break;
  }

  return null;
};

/**
 * Validate Pakistani phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
const isValidPakistaniPhone = (phone) => {
  // Pakistani phone number format: +92xxxxxxxxxx (13 digits total)
  const phoneRegex = /^\+92[0-9]{10}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} True if valid
 */
const isValidPassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate Pakistani CNIC number
 * @param {string} cnic - CNIC to validate
 * @returns {boolean} True if valid
 */
const isValidCNIC = (cnic) => {
  // CNIC format: xxxxx-xxxxxxx-x
  const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]$/;
  return cnicRegex.test(cnic);
};

/**
 * Validate coordinates [longitude, latitude]
 * @param {Array} coordinates - Coordinates array
 * @returns {boolean} True if valid
 */
const isValidCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }

  const [lng, lat] = coordinates;
  
  // Longitude: -180 to 180, Latitude: -90 to 90
  return (
    typeof lng === 'number' && lng >= -180 && lng <= 180 &&
    typeof lat === 'number' && lat >= -90 && lat <= 90
  );
};

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return validator.escape(input);
};

/**
 * Validate file upload
 * @param {Object} file - File object from multer
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    required = false
  } = options;

  const errors = [];

  if (required && !file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }

  if (!file) {
    return { isValid: true, errors: [] };
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must not exceed ${Math.round(maxSize / (1024 * 1024))}MB`);
  }

  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate multiple files
 * @param {Array} files - Array of file objects
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
const validateFiles = (files, options = {}) => {
  const {
    maxCount = 10,
    maxSize = 10 * 1024 * 1024,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    required = false
  } = options;

  const errors = [];

  if (required && (!files || files.length === 0)) {
    errors.push('At least one file is required');
    return { isValid: false, errors };
  }

  if (!files || files.length === 0) {
    return { isValid: true, errors: [] };
  }

  // Check file count
  if (files.length > maxCount) {
    errors.push(`Maximum ${maxCount} files allowed`);
  }

  // Validate each file
  files.forEach((file, index) => {
    const fileValidation = validateFile(file, { maxSize, allowedTypes });
    if (!fileValidation.isValid) {
      errors.push(`File ${index + 1}: ${fileValidation.errors.join(', ')}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateInput,
  validateField,
  isValidPakistaniPhone,
  isValidPassword,
  isValidCNIC,
  isValidCoordinates,
  sanitizeInput,
  validateFile,
  validateFiles
};