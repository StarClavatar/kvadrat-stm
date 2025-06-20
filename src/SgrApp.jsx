import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { debounce, keyBy } from 'lodash';
import { SearchIcon } from "./assets/search-icon";
import CartIcon from "./assets/cart-icon";
import "./SgrApp.css";
import ProductCard from "./ProductCard";
import Cart from "./Cart";
import EmptyIcon from "./assets/empty-icon";
import MenuIcon from './assets/menu-icon';
import CategoryModal from './CategoryModal';
import IconX from "./assets/Icon-x";

// Флаг для включения/выключения системы количеств в карточках
const ENABLE_QUANTITY_IN_CARDS = false;

const SgrApp = () => {
  const ENABLE_QUANTITY_IN_CARDS = false;

  const [products, setProducts] = useState([]);
  const [productsById, setProductsById] = useState({});
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [productCounts, setProductCounts] = useState({}); // Для старой системы
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartClosing, setIsCartClosing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [inputValue, setInputValue] = useState(""); // State for both search inputs
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Refs and state for the sticky sidebar logic
  const sidebarRef = useRef(null);
  const sidebarPlaceholderRef = useRef(null);
  const mainContentRef = useRef(null);
  const [isSidebarFixed, setIsSidebarFixed] = useState(false);
  const [isDesktopView, setIsDesktopView] = useState(window.innerWidth > 1024);

  useEffect(() => {
    const checkView = () => {
      setIsDesktopView(window.innerWidth > 1024);
    };
    window.addEventListener("resize", checkView);
    checkView(); // Initial check
    return () => window.removeEventListener("resize", checkView);
  }, []);

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
        const savedCart = localStorage.getItem("cartItems");
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }

        // Загружаем состояние количеств для старой системы
        if (ENABLE_QUANTITY_IN_CARDS) {
          const savedCounts = localStorage.getItem("productCounts");
          if (savedCounts) {
            setProductCounts(JSON.parse(savedCounts));
          }
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

  useEffect(() => {
    const handleScroll = () => {
      // Logic for sticky search bar
      const searchSection = document.querySelector('.search-section');
      if (searchSection) {
        const searchRect = searchSection.getBoundingClientRect();
        setShowStickySearch(searchRect.bottom <= 0);
      }

      // Logic for sticky sidebar
      if (isDesktopView && sidebarRef.current && sidebarPlaceholderRef.current && mainContentRef.current) {
        const placeholderTop = sidebarPlaceholderRef.current.getBoundingClientRect().top;
        const stickyHeaderHeight = 84; // Высота хедера + отступ
        
        const mainContentHeight = mainContentRef.current.offsetHeight;
        const sidebarHeight = sidebarRef.current.offsetHeight;
        const canBeSticky = mainContentHeight > sidebarHeight;

        if (canBeSticky && placeholderTop <= stickyHeaderHeight && !isSidebarFixed) {
          setIsSidebarFixed(true);
        } else if ((!canBeSticky || placeholderTop > stickyHeaderHeight) && isSidebarFixed) {
          setIsSidebarFixed(false);
        }
      } else if (isSidebarFixed) {
          setIsSidebarFixed(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSidebarFixed, isDesktopView]);

  const debouncedSetSearchTerm = useCallback(debounce(setSearchTerm, 300), []);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setInputValue(value);
    debouncedSetSearchTerm(value);
  };

  const handleClearSearch = () => {
    setInputValue('');
    setSearchTerm('');
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // 1. Фильтруем по выбранной категории
    if (selectedCategory) {
      filtered = filtered.filter(p =>
        p.categories && p.categories.includes(selectedCategory)
      );
    }

    // 2. Если нет поискового запроса, просто сортируем по имени и возвращаем
    if (!searchTerm.trim()) {
      return [...filtered].sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
    }
    
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    // 3. Находим совпадения по названию продукта
    const nameMatches = filtered.filter(p =>
      p.productName?.toLowerCase().includes(lowercasedSearchTerm)
    );

    // 4. Находим совпадения по составу (я предполагаю, что это поле 'activeSubstances'),
    //    исключая те, что уже найдены по имени.
    const compositionMatches = filtered.filter(p =>
      !p.productName?.toLowerCase().includes(lowercasedSearchTerm) &&
      p.activeSubstances?.toLowerCase().includes(lowercasedSearchTerm)
    );

    // 5. Сортируем обе группы по названию продукта
    nameMatches.sort((a, b) => (a.productName || '').length - (b.productName || '').length);
    compositionMatches.sort((a, b) => (a.productName || '').length - (b.productName || '').length);

    // 6. Объединяем результаты
    return [...nameMatches, ...compositionMatches];
  }, [products, selectedCategory, searchTerm]);

  const addToCart = useCallback((uniqueId) => {
    const product = productsById[uniqueId];
    if (!product) return;

    if (ENABLE_QUANTITY_IN_CARDS) {
      // Открываем корзину при клике на кнопку корзины в старой системе
      setIsCartOpen(true);
    } else {
      // Новая система - добавляем/убираем товар
      setCartItems((prev) => {
        const isInCart = prev.some(item => item.uniqueId === uniqueId);
        
        let newCartItems;
        if (isInCart) {
          newCartItems = prev.filter(item => item.uniqueId !== uniqueId);
        } else {
          newCartItems = [...prev, { ...product, quantity: 1 }];
        }
        
        localStorage.setItem('cartItems', JSON.stringify(newCartItems));
        return newCartItems;
      });
    }
  }, [productsById]);

  const updateCartItemQuantity = useCallback((uniqueId, increment) => {
    setCartItems((prev) => {
      const newCartItems = prev.map(item => {
        if (item.uniqueId === uniqueId) {
          const newQuantity = increment 
            ? item.quantity + 1 
            : Math.max(1, item.quantity - 1);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      return newCartItems;
    });
  }, []);

  const setCartItemQuantity = useCallback((uniqueId, quantity) => {
    const newQty = Math.max(1, parseInt(quantity, 10) || 1);
    
    setCartItems((prev) => {
      const newCartItems = prev.map(item => {
        if (item.uniqueId === uniqueId) {
          return { ...item, quantity: newQty };
        }
        return item;
      });
      
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      return newCartItems;
    });
  }, []);

  const removeFromCart = useCallback((uniqueId) => {
    setCartItems((prev) => {
      const newCartItems = prev.filter(item => item.uniqueId !== uniqueId);
      localStorage.setItem('cartItems', JSON.stringify(newCartItems));
      return newCartItems;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem('cartItems');
  }, []);

  const closeCart = useCallback(() => {
    setIsCartClosing(true);
    setTimeout(() => {
      setIsCartOpen(false);
      setIsCartClosing(false);
    }, 300);
  }, []);

  const isProductInCart = useCallback((uniqueId) => {
    return cartItems.some(item => item.uniqueId === uniqueId);
  }, [cartItems]);

  // Функции для старой системы количеств
  const updateProductCount = useCallback((uniqueId, increment) => {
    if (!ENABLE_QUANTITY_IN_CARDS) return;
    
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

  const setProductQuantity = useCallback((uniqueId, quantity) => {
    if (!ENABLE_QUANTITY_IN_CARDS) return;
    
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

  // Синхронизация корзины с количествами товаров (только для старой системы)
  useEffect(() => {
    if (!ENABLE_QUANTITY_IN_CARDS || !isInitialized || !products.length) return;

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
  }, [productCounts, productsById, isInitialized, products.length]);

  if (loading) {
    return (
      <div className="sgr-app">
        <div className="loading">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="sgr-app">
      {/* Sticky поисковая строка */}
      <div className={`sticky-search-bar ${showStickySearch ? 'visible' : ''}`}>
        <div className="sticky-search-controls">
          <button 
            className="sticky-menu-btn"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            <MenuIcon />
          </button>
          <div className="sticky-search-input-wrapper">
            
            <input
              type="text"
              className="sticky-search-input"
              value={inputValue}
              onChange={handleSearchChange}
              placeholder="Поиск по рецептурам..."
            />
            {inputValue ? (
              <button className="clear-search-btn" onClick={handleClearSearch}>
                <IconX />
              </button>
            ) : (
              <span className="search-icon">
                <SearchIcon />
              </span>
            )}
          </div>
          <button 
            className="sticky-cart-btn" 
            onClick={() => setIsCartOpen(true)}
          >
            <CartIcon hasItems={cartItems.length > 0} />
            {cartItems.length > 0 && (
              <span className="cart-badge">{cartItems.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Поиск */}
      <div className="search-section">
        <div className="search-container">
          <h2 className="search-title">Зарегистрированные рецептуры</h2>
          <p className="search-subtitle">Выбрать интересующие рецептуры и запросить предложение</p>
          <div className="header-controls">
            <div className="input-container">
              <input
                type="text"
                className="search-input"
                value={inputValue}
                onChange={handleSearchChange}
                placeholder="Поиск"
              />
              {inputValue ? (
                <button className="clear-search-btn" onClick={handleClearSearch}>
                  <IconX />
                </button>
              ) : (
                <span className="search-icon">
                  <SearchIcon />
                </span>
              )}
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
        </div>
      </div>

      {/* Основной контент */}
      <div className="main-container-wrapper">
        <div className="main-container">
          {/* Контейнер-распорка для сайдбара */}
          <div ref={sidebarPlaceholderRef} className="sidebar-placeholder">
            <aside ref={sidebarRef} className={`categories-sidebar ${isSidebarFixed ? 'is-fixed' : ''}`}>
              <div className="categories-header">
                <h3>Категории</h3>
              </div>
              <nav className="categories-nav">
                <button
                  className={`category-item ${selectedCategory === "" ? "active" : ""}`}
                  onClick={() => {
                    setSelectedCategory("");
                    handleClearSearch();
                  }}
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
          </div>

          {/* Правая колонка - товары */}
          <main ref={mainContentRef} className="products-content">
            {filteredAndSortedProducts.length === 0 ? (
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
                  {filteredAndSortedProducts.map((product, idx) => (
                    <ProductCard
                      key={product.uniqueId}
                      index={idx}
                      product={product}
                      enableQuantitySystem={ENABLE_QUANTITY_IN_CARDS}
                      // Пропсы для новой системы
                      isInCart={!ENABLE_QUANTITY_IN_CARDS && isProductInCart(product.uniqueId)}
                      onAddToCart={addToCart}
                      // Пропсы для старой системы
                      count={ENABLE_QUANTITY_IN_CARDS ? (productCounts[product.uniqueId] || 0) : 0}
                      onUpdateCount={updateProductCount}
                      onSetQuantity={setProductQuantity}
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
        onUpdateCount={updateCartItemQuantity}
        onSetQuantity={setCartItemQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
    </div>
  );
};

export default SgrApp;
