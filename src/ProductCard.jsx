import React, { useState, useEffect } from 'react';
import ExpandIcon from './assets/expand-icon';
import CartIcon from './assets/cart-icon';

const ProductCard = React.memo(({
  product,
  isExpanded,
  count,
  onToggle,
  onUpdateCount,
  onSetQuantity,
  onAddToCart,
  tags
}) => {
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [tempQty, setTempQty] = useState(count.toString());

  const handleQtyClick = (e) => {
    e.stopPropagation();
    setTempQty(count.toString());
    setIsEditingQty(true);
  };

  const handleQtyChange = (e) => {
    setTempQty(e.target.value);
  };

  const handleQtyBlur = () => {
    onSetQuantity(product.certificateNumber, tempQty);
    setIsEditingQty(false);
  };
  
  const handleQtyKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSetQuantity(product.certificateNumber, tempQty);
      setIsEditingQty(false);
    }
  };

  useEffect(() => {
    if (!isEditingQty) {
      setTempQty(count.toString());
    }
  }, [count, isEditingQty]);

  return (
    <div className="product-card">
      <div
        className={`product-header ${isExpanded ? "expanded" : ""}`}
        onClick={() => onToggle(product.certificateNumber)}
      >
        <div className="product-main-info">
          <span className={`expand-icon ${isExpanded ? "rotated" : ""}`}>
            <ExpandIcon />
          </span>
          <span className="product-title">{product.productName}</span>
        </div>

        <div className="product-controls">
          <div className="tags">
            {tags.map((tag, index) => (
              <span key={index} className="product-tag">{tag}</span>
            ))}
          </div>

          <div className="quantity-controls">
            <button
              className="qty-btn minus"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateCount(product.certificateNumber, false);
              }}
            >
              −
            </button>
            {isEditingQty ? (
              <input
                type="number"
                className="qty-input"
                value={tempQty}
                onChange={handleQtyChange}
                onBlur={handleQtyBlur}
                onKeyDown={handleQtyKeyDown}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="qty-display" onClick={handleQtyClick}>
                {count}
              </span>
            )}
            <button
              className="qty-btn plus"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateCount(product.certificateNumber, true);
              }}
            >
              +
            </button>
            <button
              className="remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
            >
              <CartIcon />
            </button>
          </div>
        </div>
      </div>

      <div className={`product-details ${isExpanded ? "expanded" : ""}`}>
        <div className="details-grid">
            <div className="detail-row">
                <span className="detail-label">Форма выпуска</span>
                <span className="detail-value">
                    {product.releaseForm || "Не указано"}
                </span>
            </div>

            <div className="detail-row">
                <span className="detail-label">
                    Номер свидетельства и дата
                </span>
                <span className="detail-value">
                    {product.certificateNumber} от{" "}
                    {product.certificateDate}
                </span>
            </div>

            <div className="detail-row">
                <span className="detail-label">Год</span>
                <span className="detail-value">
                    {product.certificateDate
                    ? new Date(
                        product.certificateDate
                            .split(".")
                            .reverse()
                            .join("-")
                        ).getFullYear()
                    : "Не указан"}
                </span>
            </div>

            <div className="detail-row">
                <span className="detail-label">Продукция</span>
                <span className="detail-value">
                    {product.applicationArea || "Не указано"}
                </span>
            </div>

            <div className="detail-row">
                <span className="detail-label">
                    Область применения
                </span>
                <span className="detail-value">
                    {product.applicationArea || "Не указано"}
                </span>
            </div>

            {product.composition && (
                <div className="detail-row full-width">
                    <span className="detail-label">Состав</span>
                    <span className="detail-value">
                    {product.composition}
                    </span>
                </div>
            )}

            {product.activeSubstances && (
                <div className="detail-row full-width">
                    <span className="detail-label">
                    Активные вещества
                    </span>
                    <span className="detail-value">
                    {product.activeSubstances}
                    </span>
                </div>
            )}

            {product.usageRecommendations && (
                <div className="detail-row full-width">
                    <span className="detail-label">
                    Протоколы исследований
                    </span>
                    <span className="detail-value">
                    {product.usageRecommendations}
                    </span>
                </div>
            )}

            {product.manufacturer && (
                <div className="detail-row full-width">
                    <span className="detail-label">
                    Производитель
                    </span>
                    <span className="detail-value">
                    {product.manufacturer}
                    </span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
});

export default ProductCard; 