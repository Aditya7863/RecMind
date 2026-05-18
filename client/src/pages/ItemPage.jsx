import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import SimilarItems from '../components/SimilarItems';
import { useAuth } from '../context/AuthContext';

const ItemPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/items/${id}`);
      setItem(res.data.data);
    } catch (err) {
      console.error('Failed to fetch item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating) => {
    if (!user) {
      alert('Please login to rate');
      return;
    }
    try {
      await api.post(`/api/items/${id}/rate`, { rating });
      setUserRating(rating);
      setRatingSubmitted(true);
      // Track interaction
      await api.post('/api/recommendations/interactions', {
        itemId: id,
        type: 'rating',
        rating
      });
    } catch (err) {
      console.error('Failed to submit rating:', err);
    }
  };

  const handleInteraction = async (type) => {
    if (!user) return;
    try {
      await api.post('/api/recommendations/interactions', {
        itemId: id,
        type
      });
    } catch (err) {
      console.error('Failed to track interaction:', err);
    }
  };

  if (loading) {
    return (
      <div className="item-page">
        <div className="item-detail skeleton-detail">
          <div className="skeleton-image-large" />
          <div className="skeleton-text-large" />
        </div>
      </div>
    );
  }

  if (!item) return <div className="item-page"><p>Item not found</p></div>;

  return (
    <div className="item-page">
      <div className="item-detail">
        <div className="item-detail-image">
          <img src={item.imageUrl} alt={item.title} />
        </div>

        <div className="item-detail-info">
          <span className="item-detail-category">{item.category}</span>
          <h1>{item.title}</h1>
          <p className="item-detail-description">{item.description || 'No description available.'}</p>

          <div className="item-detail-meta">
            <div className="meta-item">
              <span className="meta-label">Rating</span>
              <span className="meta-value">
                <span className="star">★</span> {item.averageRating?.toFixed(1)} ({item.ratingCount} ratings)
              </span>
            </div>
            {item.features?.releaseYear && (
              <div className="meta-item">
                <span className="meta-label">Year</span>
                <span className="meta-value">{item.features.releaseYear}</span>
              </div>
            )}
            {item.features?.duration && (
              <div className="meta-item">
                <span className="meta-label">Duration</span>
                <span className="meta-value">{item.features.duration} min</span>
              </div>
            )}
            <div className="meta-item">
              <span className="meta-label">Popularity</span>
              <span className="meta-value">{item.popularity?.toLocaleString()}</span>
            </div>
          </div>

          {item.tags?.length > 0 && (
            <div className="item-tags">
              {item.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}

          {/* Rating Section */}
          <div className="rating-section">
            <h4>Rate this title</h4>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  className={`star-btn ${star <= userRating ? 'active' : ''}`}
                  onClick={() => handleRating(star)}
                  disabled={ratingSubmitted}
                >
                  ★
                </button>
              ))}
            </div>
            {ratingSubmitted && <p className="rating-thanks">Thanks for rating!</p>}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="action-btn primary" onClick={() => handleInteraction('click')}>
              Watch Now
            </button>
            <button className="action-btn secondary" onClick={() => handleInteraction('wishlist')}>
              Add to Watchlist
            </button>
          </div>
        </div>
      </div>

      {/* Similar Items */}
      <SimilarItems itemId={id} />
    </div>
  );
};

export default ItemPage;
