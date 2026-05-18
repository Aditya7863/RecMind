const mongoose = require('mongoose');

class RecommendationEngine {
  constructor() {
    this.userItemMatrix = new Map();
    this.itemUserMatrix = new Map();
    this.itemFeatures = new Map();
    this.similarityCache = new Map();
    this.isLoaded = false;
  }

  // ==================== DATA LOADING ====================

  async loadData() {
    try {
      const Interaction = require('../models/Interaction');
      const Item = require('../models/Item');

      // Clear existing data
      this.userItemMatrix.clear();
      this.itemUserMatrix.clear();
      this.itemFeatures.clear();
      this.similarityCache.clear();

      // Load all interactions
      const interactions = await Interaction.find().lean();

      // Build matrices
      interactions.forEach(({ userId, itemId, rating, type }) => {
        const score = rating || this._getImplicitScore(type);
        const uId = userId.toString();
        const iId = itemId.toString();

        if (!this.userItemMatrix.has(uId)) {
          this.userItemMatrix.set(uId, new Map());
        }
        this.userItemMatrix.get(uId).set(iId, score);

        if (!this.itemUserMatrix.has(iId)) {
          this.itemUserMatrix.set(iId, new Map());
        }
        this.itemUserMatrix.get(iId).set(uId, score);
      });

      // Load item features for content-based
      const items = await Item.find().lean();
      items.forEach(item => {
        this.itemFeatures.set(item._id.toString(), this._vectorizeItem(item));
      });

      this.isLoaded = true;
      console.log(`Recommendation engine loaded: ${this.userItemMatrix.size} users, ${this.itemUserMatrix.size} items`);
    } catch (error) {
      console.error('Error loading recommendation data:', error);
    }
  }

  _getImplicitScore(type) {
    const weights = { view: 1, click: 2, wishlist: 3, purchase: 4, rating: 5 };
    return weights[type] || 1;
  }

  _vectorizeItem(item) {
    return [
      this._hashString(item.category || ''),
      item.averageRating || 0,
      item.popularity || 0,
      (item.tags?.length || 0) / 10,
      item.features?.releaseYear ? (item.features.releaseYear - 1900) / 200 : 0.5
    ];
  }

  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 1000) / 1000;
  }

  // ==================== COLLABORATIVE FILTERING ====================

  getUserBasedRecommendations(userId, n = 10) {
    const userRatings = this.userItemMatrix.get(userId);
    if (!userRatings || userRatings.size === 0) return [];

    const similarities = [];
    for (const [otherUserId, otherRatings] of this.userItemMatrix) {
      if (otherUserId === userId) continue;
      const sim = this._cosineSimilarity(userRatings, otherRatings);
      if (sim > 0) similarities.push({ userId: otherUserId, similarity: sim });
    }

    similarities.sort((a, b) => b.similarity - a.similarity);
    const topUsers = similarities.slice(0, 20);

    const recommendations = new Map();
    for (const { userId: simUserId, similarity } of topUsers) {
      const simUserRatings = this.userItemMatrix.get(simUserId);
      for (const [itemId, rating] of simUserRatings) {
        if (userRatings.has(itemId)) continue;
        const current = recommendations.get(itemId) || { score: 0, totalSim: 0 };
        current.score += similarity * rating;
        current.totalSim += similarity;
        recommendations.set(itemId, current);
      }
    }

    const results = [];
    for (const [itemId, { score, totalSim }] of recommendations) {
      if (totalSim > 0) results.push({ itemId, score: score / totalSim });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, n);
  }

  getItemBasedRecommendations(userId, n = 10) {
    const userRatings = this.userItemMatrix.get(userId);
    if (!userRatings || userRatings.size === 0) return [];

    const scores = new Map();
    for (const [itemId, userRating] of userRatings) {
      const similarItems = this._getItemNeighbors(itemId, 10);
      for (const { itemId: neighborId, similarity } of similarItems) {
        if (userRatings.has(neighborId)) continue;
        const current = scores.get(neighborId) || 0;
        scores.set(neighborId, current + similarity * userRating);
      }
    }

    const results = Array.from(scores.entries())
      .map(([itemId, score]) => ({ itemId, score }))
      .sort((a, b) => b.score - a.score);

    return results.slice(0, n);
  }

  async getItemBasedRecommendationsForItem(itemId, n = 6) {
    const neighbors = this._getItemNeighbors(itemId, n);
    const Item = require('../models/Item');
    const itemIds = neighbors.map(n => n.itemId);
    const items = await Item.find({ _id: { $in: itemIds } }).lean();
    const itemMap = new Map(items.map(i => [i._id.toString(), i]));

    return neighbors.map(n => ({
      ...n,
      item: itemMap.get(n.itemId)
    })).filter(n => n.item);
  }

  _getItemNeighbors(itemId, k) {
    const cacheKey = `item_${itemId}`;
    if (this.similarityCache.has(cacheKey)) {
      return this.similarityCache.get(cacheKey);
    }

    const itemUsers = this.itemUserMatrix.get(itemId);
    if (!itemUsers || itemUsers.size === 0) return [];

    const similarities = [];
    for (const [otherItemId, otherUsers] of this.itemUserMatrix) {
      if (otherItemId === itemId) continue;
      const sim = this._cosineSimilarity(itemUsers, otherUsers);
      if (sim > 0) similarities.push({ itemId: otherItemId, similarity: sim });
    }

    similarities.sort((a, b) => b.similarity - a.similarity);
    const neighbors = similarities.slice(0, k);
    this.similarityCache.set(cacheKey, neighbors);
    return neighbors;
  }

  // ==================== CONTENT-BASED FILTERING ====================

  getContentBasedRecommendations(userId, n = 10) {
    const userRatings = this.userItemMatrix.get(userId);
    if (!userRatings || userRatings.size === 0) return [];

    const likedItems = [];
    for (const [itemId, rating] of userRatings) {
      if (rating >= 3) {
        const features = this.itemFeatures.get(itemId);
        if (features) likedItems.push(features);
      }
    }

    if (likedItems.length === 0) return [];

    const userProfile = likedItems[0].map((_, i) => {
      const sum = likedItems.reduce((acc, vec) => acc + vec[i], 0);
      return sum / likedItems.length;
    });

    const scores = [];
    for (const [itemId, features] of this.itemFeatures) {
      if (userRatings.has(itemId)) continue;
      const sim = this._cosineSimilarityVector(userProfile, features);
      scores.push({ itemId, score: sim });
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, n);
  }

  // ==================== HYBRID COMBINATION ====================

  async getHybridRecommendations(userId, n = 10) {
    if (!this.isLoaded) await this.loadData();

    const cfRecs = this.getItemBasedRecommendations(userId, n * 2);
    const cbRecs = this.getContentBasedRecommendations(userId, n * 2);

    const scores = new Map();
    const CF_WEIGHT = 0.7;
    const CB_WEIGHT = 0.3;

    cfRecs.forEach(({ itemId, score }, idx) => {
      const rankScore = score * (1 / (idx + 1));
      scores.set(itemId, (scores.get(itemId) || 0) + CF_WEIGHT * rankScore);
    });

    cbRecs.forEach(({ itemId, score }, idx) => {
      const rankScore = score * (1 / (idx + 1));
      scores.set(itemId, (scores.get(itemId) || 0) + CB_WEIGHT * rankScore);
    });

    const results = Array.from(scores.entries())
      .map(([itemId, score]) => ({ itemId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, n);

    const Item = require('../models/Item');
    const itemIds = results.map(r => r.itemId);
    const items = await Item.find({ _id: { $in: itemIds } }).lean();
    const itemMap = new Map(items.map(i => [i._id.toString(), i]));

    return results.map(r => ({
      ...r,
      item: itemMap.get(r.itemId)
    })).filter(r => r.item);
  }

  // ==================== SIMILARITY UTILITIES ====================

  _cosineSimilarity(mapA, mapB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const [key, valA] of mapA) {
      normA += valA * valA;
      if (mapB.has(key)) {
        dotProduct += valA * mapB.get(key);
      }
    }

    for (const valB of mapB.values()) {
      normB += valB * valB;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  _cosineSimilarityVector(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // ==================== COLD START ====================

  async getPopularRecommendations(n = 10, category = null) {
    const Item = require('../models/Item');
    const query = category ? { category } : {};

    return await Item.find(query)
      .sort({ popularity: -1, averageRating: -1 })
      .limit(n)
      .lean();
  }

  // ==================== STATS ====================

  getStats() {
    return {
      users: this.userItemMatrix.size,
      items: this.itemUserMatrix.size,
      interactions: Array.from(this.userItemMatrix.values())
        .reduce((sum, m) => sum + m.size, 0),
      cachedSimilarities: this.similarityCache.size
    };
  }
}

module.exports = new RecommendationEngine();
