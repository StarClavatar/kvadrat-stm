import React, { useState, useEffect, useCallback } from "react";
import { SearchIcon } from "./assets/search-icon";
import ExpandIcon from "./assets/expand-icon";
import CartIcon from "./assets/cart-icon";
import ArrowIconButton from "./assets/arrow-icon-button";
import "./SgrApp.css";
import ProductCard from "./ProductCard";
import Cart from "./Cart";
import EmptyIcon from "./assets/empty-icon";

const SgrApp = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [editingQty, setEditingQty] = useState(null);
  const [tempQty, setTempQty] = useState("");
  const [isCartClosing, setIsCartClosing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    comment: ''
  });

  useEffect(() => {
    // Загружаем данные из sgr-converted.json
    const loadData = async () => {
      try {
        const response = await fetch("/sgr-converted.json");
        const data = await response.json();

        setProducts(data);

        // Извлекаем все уникальные категории
        const allCategories = new Set();
        data.forEach((product) => {
          if (product.categories && Array.isArray(product.categories)) {
            product.categories.forEach((category) => {
              if (category && category.trim()) {
                allCategories.add(category.trim());
              }
            });
          }
        });

        setCategories([...allCategories].sort());
        
        // Загружаем состояние корзины из localStorage
        const savedCounts = localStorage.getItem('productCounts');
        const savedCart = localStorage.getItem('cartItems');
        
        if (savedCounts) {
          setProductCounts(JSON.parse(savedCounts));
        }
        
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
        
        setIsInitialized(true);
        setLoading(false);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Фильтрация товаров
  const getFilteredProducts = () => {
    let filtered = products;

    // Фильтр по категории
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) =>
          product.categories && product.categories.includes(selectedCategory)
      );
    }

    // Фильтр по поиску
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.productName?.toLowerCase().includes(term) ||
          product.certificateNumber?.toLowerCase().includes(term) ||
          product.manufacturer?.toLowerCase().includes(term) ||
          product.activeSubstances?.toLowerCase().includes(term) ||
          product.applicationArea?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const toggleProduct = useCallback((certificateNumber) => {
    setExpandedProducts((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(certificateNumber)) {
        newExpanded.delete(certificateNumber);
      } else {
        newExpanded.add(certificateNumber);
      }
      return newExpanded;
    });
  }, []);

  const updateProductCount = useCallback((certificateNumber, increment) => {
    setProductCounts((prev) => {
      const currentCount = prev[certificateNumber] || 0;
      const newCount = increment
        ? currentCount + 1
        : Math.max(0, currentCount - 1);
      const newCounts = { ...prev, [certificateNumber]: newCount };
      
      localStorage.setItem('productCounts', JSON.stringify(newCounts));
      
      return newCounts;
    });
  }, []);

  const addToCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  // Синхронизация корзины с количествами товаров
  useEffect(() => {
    if (!isInitialized || !products.length) return;

    const newCartItems = Object.entries(productCounts)
      .map(([certificateNumber, quantity]) => {
        if (quantity > 0) {
          const product = products.find(
            (p) => p.certificateNumber === certificateNumber
          );
          if (product) {
            return { ...product, quantity };
          }
        }
        return null;
      })
      .filter(Boolean);

    setCartItems(currentCartItems => {
        if (JSON.stringify(currentCartItems) !== JSON.stringify(newCartItems)) {
            localStorage.setItem('cartItems', JSON.stringify(newCartItems));
            return newCartItems;
        }
        return currentCartItems;
    });
  }, [productCounts, products, isInitialized]);

  const setProductQuantity = useCallback((certificateNumber, quantity) => {
    const newQty = Math.max(0, parseInt(quantity) || 0);
    setProductCounts((prev) => {
      const newCounts = {
        ...prev,
        [certificateNumber]: newQty,
      };
      
      localStorage.setItem('productCounts', JSON.stringify(newCounts));
      
      return newCounts;
    });
  }, []);

  const clearCart = useCallback(() => {
    setProductCounts({});
    setCartItems([]);
    localStorage.removeItem('productCounts');
    localStorage.removeItem('cartItems');
  }, []);

  const closeCart = useCallback(() => {
    setIsCartClosing(true);
    setTimeout(() => {
      setIsCartOpen(false);
      setIsCartClosing(false);
      setIsFormVisible(false);
    }, 300);
  }, []);

  const getProductTags = useCallback((product) => {
    const tags = [];
    if (product.categories && product.categories.length > 0) {
      tags.push(product.categories[0]);
    }
    if (product.releaseForm) {
      tags.push(product.releaseForm);
    }
    return tags;
  }, []);

  const filteredProducts = getFilteredProducts();

  if (loading) {
    return (
      <div className="sgr-app">
        <div className="loading">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="sgr-app">
      {/* Поиск */}
      <div className="search-section">
        <div className="search-container">
          <h2 className="search-title">Рецептуры СТМ</h2>
          <div className="input-container">
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
              }}
              placeholder="Поиск"
            />
            <span className="search-icon">
              <SearchIcon />
            </span>
          </div>
          {/* <img src={searchBg} alt="" className='search-bg'/> */}
        </div>
      </div>

      {/* Основной контент */}
      <div className="main-container-wrapper">
        <div className="main-container">
          {/* Левая колонка - категории */}
          <aside className="categories-sidebar">
            <div className="categories-header">
              <h3>Категории</h3>
            </div>
            <nav className="categories-nav">
              <button
                className={`category-item ${!selectedCategory ? "active" : ""}`}
                onClick={() => setSelectedCategory("")}
              >
                {!selectedCategory && <span className="bullet"></span>}
                Все категории
              </button>
              {categories.map((category, index) => (
                <button
                  key={index}
                  className={`category-item ${
                    selectedCategory === category ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {selectedCategory === category && (
                    <span className="bullet"></span>
                  )}
                  {category}
                </button>
              ))}
            </nav>
          </aside>

          {/* Правая колонка - товары */}
          <main className="products-content">
            {filteredProducts.length === 0 ? (
                searchTerm ? (
                  <div className="empty-search-results">
                    <EmptyIcon />
                    <h3>К сожалению, по вашему запросу ничего не найдено</h3>
                    <p>Убедитесь, что все слова написаны правильно или попробуйте использовать другие ключевые слова.</p>
                  </div>
                ) : (
                  <div className="empty-state">
                    Нет данных для отображения
                  </div>
                )
            ) : (
              <div className="products-list">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.certificateNumber}
                    product={product}
                    isExpanded={expandedProducts.has(product.certificateNumber)}
                    count={productCounts[product.certificateNumber] || 0}
                    tags={getProductTags(product)}
                    onToggle={toggleProduct}
                    onUpdateCount={updateProductCount}
                    onSetQuantity={setProductQuantity}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <Cart 
        isOpen={isCartOpen}
        isClosing={isCartClosing}
        onClose={closeCart}
        cartItems={cartItems}
        onUpdateCount={updateProductCount}
        onClearCart={clearCart}
      />
    </div>
  );
};

export default SgrApp;
