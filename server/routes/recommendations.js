const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const recEngine = require('../services/recommendationEngine');
const Interaction = require('../models/Interaction');
const Item = require('../models/Item');

// @route   GET /api/recommendations/for-you
// @desc    Get personalized recommendations
// @access  Private
router.get('/for-you', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const interactionCount = await Interaction.countDocuments({ userId });

    let recommendations;
    let personalized = false;

    if (interactionCount < 3) {
      recommendations = await recEngine.getPopularRecommendations(limit);
    } else {
      recommendations = await recEngine.getHybridRecommendations(userId, limit);
      personalized = true;
    }

    res.json({
      success: true,
      data: recommendations,
      personalized,
      interactionCount
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/recommendations/similar/:itemId
// @desc    Get similar items
// @access  Public
router.get('/similar/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const limit = parseInt(req.query.limit) || 6;

    const similar = await recEngine.getItemBasedRecommendationsForItem(itemId, limit);
    res.json({ success: true, data: similar });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/recommendations/popular
// @desc    Get popular items
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category || null;

    const items = await recEngine.getPopularRecommendations(limit, category);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/recommendations/stats
// @desc    Get engine stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const stats = recEngine.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/interactions
// @desc    Track user interaction
// @access  Private
router.post('/interactions', auth, async (req, res) => {
  try {
    const { itemId, type, rating } = req.body;

    if (!['view', 'click', 'purchase', 'rating', 'wishlist'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid interaction type' });
    }

    const interaction = new Interaction({
      userId: req.user.id,
      itemId,
      type,
      rating: type === 'rating' ? rating : undefined
    });

    await interaction.save();

    if (type === 'rating') {
      await Item.updateRatingStats(itemId);
    }

    res.status(201).json({ success: true, data: interaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/interactions/history
// @desc    Get user interaction history
// @access  Private
router.get('/interactions/history', auth, async (req, res) => {
  try {
    const interactions = await Interaction.find({ userId: req.user.id })
      .populate('itemId', 'title imageUrl category')
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: interactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
