const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Interaction = require('../models/Interaction');
const auth = require('../middleware/auth');

// @route   GET /api/items
// @desc    Get all items with pagination & filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, sort = 'popularity' } = req.query;
    const query = {};

    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const sortOption = {};
    if (sort === 'popularity') sortOption.popularity = -1;
    else if (sort === 'rating') sortOption.averageRating = -1;
    else if (sort === 'newest') sortOption.createdAt = -1;

    const items = await Item.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Item.countDocuments(query);

    res.json({
      success: true,
      data: items,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/items/:id
// @desc    Get single item
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).lean();
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Track view if user is logged in
    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        await Interaction.create({
          userId: decoded.id,
          itemId: item._id,
          type: 'view'
        });
      } catch (e) {
        // Invalid token, ignore
      }
    }

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/items/categories
// @desc    Get all categories
// @access  Public
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Item.distinct('category');
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/items/:id/rate
// @desc    Rate an item
// @access  Private
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { rating } = req.body;
    const itemId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Upsert interaction
    await Interaction.findOneAndUpdate(
      { userId: req.user.id, itemId, type: 'rating' },
      { rating, timestamp: new Date() },
      { upsert: true, new: true }
    );

    // Update item stats
    await Item.updateRatingStats(itemId);

    res.json({ success: true, message: 'Rating submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
