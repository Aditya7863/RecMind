const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  features: {
    genre: [String],
    priceRange: {
      type: String,
      enum: ['low', 'medium', 'high', 'premium']
    },
    brand: String,
    duration: Number, // for movies (minutes)
    releaseYear: Number
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/300x450?text=No+Image'
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  popularity: {
    type: Number,
    default: 0,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Static method to update rating stats
itemSchema.statics.updateRatingStats = async function(itemId) {
  const Interaction = require('./Interaction');

  const stats = await Interaction.aggregate([
    { $match: { itemId: new mongoose.Types.ObjectId(itemId), type: 'rating', rating: { $exists: true } } },
    {
      $group: {
        _id: '$itemId',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await this.findByIdAndUpdate(itemId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      ratingCount: stats[0].count
    });
  }
};

// Text search index
itemSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Item', itemSchema);
