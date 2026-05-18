import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ItemCard from './ItemCard';

const RecommendationCarousel = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/recommendations/for-you?limit=12');
      setRecommendations(res.data.data);
      setIsPersonalized(res.data.personalized);
    } catch (err) {
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="rec-section">
        <div className="rec-header">
          <h2>Loading recommendations...</h2>
        </div>
        <div className="rec-grid loading">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="item-card skeleton">
              <div className="skeleton-image" />
              <div className="skeleton-text" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) return null;

  return (
    <section className="rec-section">
      <div className="rec-header">
        <div className="rec-title-group">
          <h2>{isPersonalized ? 'Recommended For You' : 'Popular Right Now'}</h2>
          {isPersonalized && (
            <span className="personalized-badge">
              <span className="pulse"></span>
              AI-Powered
            </span>
          )}
        </div>
        {isPersonalized && (
          <p className="rec-subtitle">Based on your viewing history and preferences</p>
        )}
      </div>

      <div className="rec-grid">
        {recommendations.map((rec) => (
          <ItemCard 
            key={rec.itemId || rec._id} 
            item={rec.item || rec} 
            showScore={isPersonalized}
            score={rec.score}
          />
        ))}
      </div>
    </section>
  );
};

export default RecommendationCarousel;
