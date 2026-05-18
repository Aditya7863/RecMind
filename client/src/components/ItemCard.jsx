import React from 'react';
import { useNavigate } from 'react-router-dom';

const ItemCard = ({ item, showScore, score }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/item/${item._id}`);
  };

  return (
    <div className="item-card" onClick={handleClick}>
      <div className="item-card-image">
        <img src={item.imageUrl} alt={item.title} loading="lazy" />
        {showScore && score !== undefined && (
          <div className="match-badge">{(score * 100).toFixed(0)}% Match</div>
        )}
      </div>
      <div className="item-card-info">
        <h3 className="item-title">{item.title}</h3>
        <p className="item-category">{item.category}</p>
        <div className="item-meta">
          <span className="item-rating">
            <span className="star">★</span> {item.averageRating?.toFixed(1)}
          </span>
          <span className="item-popularity">{item.popularity?.toLocaleString()} views</span>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
