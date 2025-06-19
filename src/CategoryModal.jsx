import React from 'react';

const CategoryModal = ({ 
  isOpen, 
  onClose, 
  categories, 
  selectedCategory, 
  onSelectCategory 
}) => {
  const handleSelect = (category) => {
    onSelectCategory(category);
    onClose();
  };

  return (
    <div 
      className={`category-modal-overlay ${isOpen ? 'visible' : ''}`} 
      onClick={onClose}
    >
      <div className="category-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="category-modal-header">
          <h3>Категории</h3>
          <button onClick={onClose} className="category-modal-close-btn">&times;</button>
        </div>
        <nav className="category-modal-nav">
          <button
            className={`category-modal-item ${selectedCategory === "" ? "active" : ""}`}
            onClick={() => handleSelect("")}
          >
            Все категории
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`category-modal-item ${selectedCategory === category ? "active" : ""}`}
              onClick={() => handleSelect(category)}
            >
              {category}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default CategoryModal; 