const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['view', 'click', 'purchase', 'rating', 'wishlist'],
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes for fast lookups
interactionSchema.index({ userId: 1, itemId: 1, type: 1 });
interactionSchema.index({ userId: 1, timestamp: -1 });
interactionSchema.index({ itemId: 1, timestamp: -1 });

module.exports = mongoose.model('Interaction', interactionSchema);
