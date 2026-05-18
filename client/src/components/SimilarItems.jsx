import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ItemCard from './ItemCard';

const SimilarItems = ({ itemId }) => {
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/recommendations/similar/${itemId}?limit=6`);
        setSimilar(res.data.data);
      } catch (err) {
        console.error('Failed to fetch similar items:', err);
      } finally {
        setLoading(false);
      }
    };

    if (itemId) fetchSimilar();
  }, [itemId]);

  if (loading || similar.length === 0) return null;

  return (
    <section className="similar-section">
      <h3 className="similar-title">Customers Also Viewed</h3>
      <div className="rec-grid small">
        {similar.map((item) => (
          <ItemCard key={item.itemId} item={item.item} />
        ))}
      </div>
    </section>
  );
};

export default SimilarItems;
