const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // Basic Information
  id: {
    type: String,
    required: [true, 'Category ID is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  nameUrdu: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  descriptionUrdu: {
    type: String,
    maxlength: [500, 'Urdu description cannot exceed 500 characters']
  },

  // Visual Elements
  icon: {
    type: String,
    required: [true, 'Category icon is required']
  },
  color: {
    type: String,
    default: '#4F46E5'
  },
  image: {
    public_id: String,
    url: String
  },

  // Subcategories
  subcategories: [{
    id: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    nameUrdu: {
      type: String,
      trim: true
    },
    description: String,
    descriptionUrdu: String,
    icon: String,
    image: {
      public_id: String,
      url: String
    },
    active: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    // Dynamic form fields for this subcategory
    formFields: [{
      name: {
        type: String,
        required: true
      },
      label: {
        type: String,
        required: true
      },
      labelUrdu: String,
      type: {
        type: String,
        enum: ['text', 'number', 'select', 'multiselect', 'checkbox', 'radio', 'textarea', 'date', 'file'],
        required: true
      },
      required: {
        type: Boolean,
        default: false
      },
      placeholder: String,
      placeholderUrdu: String,
      options: [String], // For select, multiselect, radio
      validation: {
        min: Number,
        max: Number,
        minLength: Number,
        maxLength: Number,
        pattern: String,
        customMessage: String
      },
      order: {
        type: Number,
        default: 0
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Status and Settings
  active: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },

  // Statistics
  stats: {
    totalListings: {
      type: Number,
      default: 0
    },
    activeListings: {
      type: Number,
      default: 0
    },
    totalBookings: {
      type: Number,
      default: 0
    }
  },

  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    slug: String
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ id: 1 });
categorySchema.index({ active: 1, order: 1 });
categorySchema.index({ featured: 1 });
categorySchema.index({ 'subcategories.id': 1 });
categorySchema.index({ 'subcategories.active': 1 });

// Virtual for subcategory count
categorySchema.virtual('subcategoryCount').get(function() {
  return this.subcategories ? this.subcategories.filter(sub => sub.active).length : 0;
});

// Method to get subcategory by ID
categorySchema.methods.getSubcategory = function(subcategoryId) {
  return this.subcategories.find(sub => sub.id === subcategoryId);
};

// Method to add subcategory
categorySchema.methods.addSubcategory = function(subcategoryData) {
  this.subcategories.push(subcategoryData);
  return this.save();
};

// Method to update subcategory
categorySchema.methods.updateSubcategory = function(subcategoryId, updateData) {
  const subcategory = this.subcategories.find(sub => sub.id === subcategoryId);
  if (!subcategory) {
    throw new Error('Subcategory not found');
  }
  
  Object.assign(subcategory, updateData);
  return this.save();
};

// Method to remove subcategory
categorySchema.methods.removeSubcategory = function(subcategoryId) {
  this.subcategories = this.subcategories.filter(sub => sub.id !== subcategoryId);
  return this.save();
};

// Method to update listing count
categorySchema.methods.updateListingCount = function(increment = true) {
  if (increment) {
    this.stats.totalListings += 1;
    this.stats.activeListings += 1;
  } else {
    this.stats.totalListings = Math.max(0, this.stats.totalListings - 1);
    this.stats.activeListings = Math.max(0, this.stats.activeListings - 1);
  }
  return this.save({ validateBeforeSave: false });
};

// Static method to get all active categories with subcategories
categorySchema.statics.getActiveCategories = function() {
  return this.find({ active: true })
    .sort({ order: 1, name: 1 })
    .select('-__v');
};

// Static method to get category with form fields
categorySchema.statics.getCategoryWithFields = function(categoryId, subcategoryId) {
  return this.findOne({ id: categoryId, active: true })
    .then(category => {
      if (!category) return null;
      
      const subcategory = category.getSubcategory(subcategoryId);
      if (!subcategory || !subcategory.active) return null;
      
      return {
        category: {
          id: category.id,
          name: category.name,
          nameUrdu: category.nameUrdu
        },
        subcategory: {
          id: subcategory.id,
          name: subcategory.name,
          nameUrdu: subcategory.nameUrdu,
          formFields: subcategory.formFields.sort((a, b) => a.order - b.order)
        }
      };
    });
};

module.exports = mongoose.model('Category', categorySchema);