const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add an item name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  sku: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Allow null/undefined but enforce uniqueness when present
    uppercase: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price cannot be negative']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative'],
    default: 0
  },
  quantity: {
    type: Number,
    required: [true, 'Please add quantity'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  minStock: {
    type: Number,
    min: [0, 'Min stock cannot be negative'],
    default: 0
  },
  maxStock: {
    type: Number,
    min: [0, 'Max stock cannot be negative']
  },
  imageUrl: {
    type: String,
    default: ''
  },
  images: [{
    url: String,
    alt: String
  }],
  brand: {
    type: String,
    trim: true
  },
  supplier: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  tags: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  storageProvider: {
    type: String,
    default: 'b2'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for search
InventorySchema.index({ name: 'text', description: 'text', sku: 'text' });
InventorySchema.index({ category: 1 });
InventorySchema.index({ user: 1 });
InventorySchema.index({ status: 1 });

// Update updatedAt before saving
InventorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Inventory', InventorySchema);

