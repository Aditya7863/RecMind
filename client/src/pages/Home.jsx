import React, { useEffect, useState } from 'react';
import api from '../services/api';
import RecommendationCarousel from '../components/RecommendationCarousel';
import ItemCard from '../components/ItemCard';

const Home = () => {
  const [popularItems, setPopularItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryItems, setCategoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopular();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryItems(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchPopular = async () => {
    try {
      const res = await api.get('/api/recommendations/popular?limit=8');
      setPopularItems(res.data.data);
    } catch (err) {
      console.error('Failed to fetch popular items:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/items/meta/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchCategoryItems = async (category) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/items?category=${category}&limit=8`);
      setCategoryItems(res.data.data);
    } catch (err) {
      console.error('Failed to fetch category items:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Discover Your Next Favorite</h1>
          <p>AI-powered recommendations tailored to your taste</p>
        </div>
      </section>

      {/* Personalized Recommendations */}
      <RecommendationCarousel />

      {/* Category Filter */}
      <section className="category-section">
        <h2>Browse by Category</h2>
        <div className="category-tabs">
          <button 
            className={`category-tab ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Items Grid */}
      <section className="items-section">
        {selectedCategory ? (
          <>
            <h3>{selectedCategory}</h3>
            <div className="rec-grid">
              {categoryItems.map(item => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          </>
        ) : (
          <>
            <h3>Trending Now</h3>
            <div className="rec-grid">
              {popularItems.map(item => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stat-card">
          <span className="stat-number">30+</span>
          <span className="stat-label">Movies</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">Hybrid</span>
          <span className="stat-label">AI Algorithm</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">Real-time</span>
          <span className="stat-label">Recommendations</span>
        </div>
      </section>
    </div>
  );
};

export default Home;
