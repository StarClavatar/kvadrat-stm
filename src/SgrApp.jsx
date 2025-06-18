import React, { useState, useEffect, useCallback } from "react";
import { debounce, keyBy } from 'lodash';
import { SearchIcon } from "./assets/search-icon";
import CartIcon from "./assets/cart-icon";
import "./SgrApp.css";
import ProductCard from "./ProductCard";
import Cart from "./Cart";
import EmptyIcon from "./assets/empty-icon";

const SgrApp = () => {
  const [products, setProducts] = useState([]);
  const [productsById, setProductsById] = useState({});
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
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
    // Загружаем данные
    const loadData = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const apiUrl = apiBaseUrl && apiBaseUrl !== ""
          ? `${apiBaseUrl}/sgr-info-get`
          : "/api/sgr-info-get";
        
        console.log('[API] Making request to:', apiUrl);
        const response = await fetch(apiUrl);
        const responseData = await response.json();

        if (responseData.result === "success") {
          const data = responseData.data;
          
          const processedData = data.map((p, index) => ({
            ...p,
            uniqueId: p.certificateNumber || `${p.productName}-${index}`,
          }));

          setProducts(processedData);
          setProductsById(keyBy(processedData, 'uniqueId'));

          // Извлекаем все уникальные категории
          const allCategories = new Set();
          processedData.forEach((product) => {
            if (product.categories && Array.isArray(product.categories)) {
              product.categories.forEach((category) => {
                if (category && category.trim()) {
                  allCategories.add(category.trim());
                }
              });
            }
          });

          setCategories([...allCategories].sort());
        } else {
          console.error("Ошибка в формате ответа:", responseData);
        }

        // Загружаем состояние корзины из localStorage
        const savedCounts = localStorage.getItem("productCounts");
        const savedCart = localStorage.getItem("cartItems");

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

  const debouncedSetSearchTerm = useCallback(debounce(setSearchTerm, 300), []);

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

  const updateProductCount = useCallback((uniqueId, increment) => {
    setProductCounts((prev) => {
      const currentCount = prev[uniqueId] || 0;
      const newCount = increment
        ? currentCount + 1
        : Math.max(0, currentCount - 1);
      const newCounts = { ...prev, [uniqueId]: newCount };
      
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
      .map(([uniqueId, quantity]) => {
        if (quantity > 0) {
          const product = productsById[uniqueId];
          if (product) {
            return { ...product, quantity };
          }
        }
        return null;
      })
      .filter(Boolean);

    setCartItems(newCartItems);
    localStorage.setItem('cartItems', JSON.stringify(newCartItems));
  }, [productCounts, productsById, isInitialized]);

  const setProductQuantity = useCallback((uniqueId, quantity) => {
    const newQty = Math.max(0, parseInt(quantity, 10) || 0);
    setProductCounts((prev) => {
      const newCounts = {
        ...prev,
        [uniqueId]: newQty,
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

  // const getProductTags = useCallback((product) => {
  //   const tags = [];
  //   if (product.categories && product.categories.length > 0) {
  //     tags.push(product.categories[0]);
  //   }
  //   if (product.releaseForm) {
  //     tags.push(product.releaseForm);
  //   }
  //   return tags;
  // }, []);

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
          <h2 className="search-title">Зарегистрированные рецептуры</h2>
          <div className="header-controls">
            <div className="input-container">
              <input
                type="text"
                className="search-input"
                onChange={(e) => debouncedSetSearchTerm(e.target.value)}
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
            <button 
              className="floating-cart-btn" 
              onClick={() => setIsCartOpen(true)}
            >
              <CartIcon hasItems={cartItems.length > 0} />
              {cartItems.length > 0 && (
                <span className="cart-badge">{cartItems.length}</span>
              )}
            </button>
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
              className={`category-item ${selectedCategory === "" ? "active" : ""}`}
              onClick={() => setSelectedCategory("")}
            >
              {selectedCategory === "" && <span className="bullet"></span>}
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
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product.uniqueId}
                    index={idx}
                    product={product}
                    count={productCounts[product.uniqueId] || 0}
                    // tags={getProductTags(product)}
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
        onSetQuantity={setProductQuantity}
        onClearCart={clearCart}
      />
    </div>
  );
};

export default SgrApp;
