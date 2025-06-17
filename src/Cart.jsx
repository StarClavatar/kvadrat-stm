import React, { useState, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import ArrowIconButton from "./assets/arrow-icon-button";
import { phoneFormatter } from './assets/phoneFormatter';
import ThankYouView from './ThankYouView';

const Cart = React.memo(({ 
  isOpen, 
  isClosing, 
  onClose, 
  cartItems,
  onUpdateCount,
  onSetQuantity,
  onClearCart
}) => {
  const [activeView, setActiveView] = useState('cart'); // 'cart', 'form', 'success'
  const [submissionStatus, setSubmissionStatus] = useState('idle'); // 'idle', 'submitting'
  const [submissionError, setSubmissionError] = useState(null);
  const [editingItem, setEditingItem] = useState(null); // uniqueId of the item being edited
  const [tempQty, setTempQty] = useState('');
  
  const { control, register, handleSubmit, formState: { errors }, reset } = useForm({
    mode: 'onBlur',
    defaultValues: {
        name: '',
        email: '',
        phone: '',
        comment: ''
    }
  });

  const onSubmit = async (data) => {
    setSubmissionStatus('submitting');
    setSubmissionError(null);

    const payload = {
      contactInfo: {
        // !!!ВАЖНО: Замените этот email на реальный адрес получателя заявок!!!
        email_to: "clavatar@yandex.ru", 
        ...data
      },
      order: cartItems.map(item => ({
        productName: item.productName,
        certificateNumber: item.certificateNumber,
        quantity: item.quantity
      }))
    };

    console.log("Отправляемые данные:", JSON.stringify(payload, null, 2));

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const apiUrl = apiBaseUrl && apiBaseUrl !== ""
        ? `${apiBaseUrl}/order-send-email`
        : "/api/order-send-email";
      
      console.log('[API] Making request to:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
      
      // Можно добавить обработку ответа от сервера, если он что-то возвращает
      // const result = await response.json(); 
      // console.log(result);

      setActiveView('success');
      onClearCart();
      reset(); // Сбрасываем поля формы
    } catch (error) {
      console.error("Ошибка отправки:", error);
      setSubmissionError("Не удалось отправить заявку. Пожалуйста, попробуйте еще раз.");
    } finally {
      setSubmissionStatus('idle');
    }
  };

  const handleBackToCart = () => {
    setActiveView('cart');
    setSubmissionError(null);
  };

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
        setActiveView('cart');
        if (activeView === 'success') {
            reset(); // Сбрасываем форму при закрытии окна "Спасибо"
        }
    }, 400); 
  }, [onClose, reset, activeView]);
  
  const getWrapperClass = () => {
    if (activeView === 'form') return 'form-active';
    if (activeView === 'success') return 'success-active';
    return '';
  }

  // Сброс состояния при закрытии модалки
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setActiveView('cart');
        reset();
      }, 400);
    }
  }, [isOpen, reset]);

  const handleQtyClick = (item) => {
    setEditingItem(item.uniqueId);
    setTempQty(item.quantity.toString());
  };

  const handleQtyChange = (e) => {
    setTempQty(e.target.value);
  };

  const handleQtyBlur = () => {
    if (editingItem) {
      onSetQuantity(editingItem, tempQty);
    }
    setEditingItem(null);
  };

  const handleQtyKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleQtyBlur();
      e.target.blur();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`cart-overlay ${isClosing ? "closing" : ""}`}
      onClick={handleClose}
    >
      <div
        className={`cart-modal ${isClosing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`cart-views-wrapper ${getWrapperClass()}`}>
          {/* View 1: Cart */}
          <div className="cart-view">
             <div className="cart-header">
                <h2>
                  Корзина <p className="cart-count">{cartItems.length}</p>
                </h2>
                <button className="cart-close" onClick={handleClose}>
                  ×
                </button>
              </div>

              <div className="cart-content">
                {cartItems.length === 0 ? (
                  <div className="cart-empty">Корзина пуста</div>
                ) : (
                  <div className="cart-items-list">
                    {cartItems.map((item) => (
                      <div key={item.uniqueId} className="cart-item">
                        <div className="cart-item-info">
                          <div className="cart-item-name">{item.productName}</div>
                        </div>
                        <div className="cart-item-controls">
                          <button
                            className="cart-qty-btn minus"
                            onClick={() => onUpdateCount(item.uniqueId, false)}
                          >
                            −
                          </button>
                          {editingItem === item.uniqueId ? (
                            <input
                              type="number"
                              className="qty-input cart"
                              value={tempQty}
                              onChange={handleQtyChange}
                              onBlur={handleQtyBlur}
                              onKeyDown={handleQtyKeyDown}
                              autoFocus
                            />
                          ) : (
                            <span className="cart-qty-display" onClick={() => handleQtyClick(item)}>
                              {item.quantity}
                            </span>
                          )}
                          <button
                            className="cart-qty-btn plus"
                            onClick={() => onUpdateCount(item.uniqueId, true)}
                          >
                            +
                          </button>
                          <button 
                            className="cart-item-remove-btn"
                            onClick={() => onSetQuantity(item.uniqueId, 0)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {cartItems.length > 0 && (
                <div className="cart-footer">
                  <button className="cart-submit-btn" onClick={() => setActiveView('form')}>
                    <ArrowIconButton /> оставить заявку
                  </button>
                </div>
              )}
              </div>
          </div>
          
          {/* View 2: Form */}
          <form className="form-view" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-header">
              <button type="button" className="back-btn" onClick={handleBackToCart}>
                ← Назад
              </button>
              <button type="button" className="cart-close" onClick={handleClose}>
                ×
              </button>
            </div>
            <div className="form-content">
              <h3>Ваши контактные данные</h3>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  placeholder="Ваше имя" 
                  {...register("name")}
                />
              </div>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  placeholder="Email*" 
                  {...register("email", { 
                    required: "Обязательное поле",
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Неверный формат email"
                    }
                  })}
                />
                {errors.email && <p className="error-message">{errors.email.message}</p>}
              </div>
              <div className="input-wrapper">
                <Controller
                    name="phone"
                    control={control}
                    rules={{ required: "Обязательное поле" }}
                    render={({ field }) => (
                        <input
                            {...field}
                            type="tel"
                            placeholder="Телефон*"
                            onChange={(e) => {
                                const formatted = phoneFormatter(e.target.value);
                                field.onChange(formatted);
                            }}
                        />
                    )}
                />
                {errors.phone && <p className="error-message">{errors.phone.message}</p>}
              </div>
              <div className="input-wrapper">
                <textarea 
                  placeholder="Комментарий"
                  {...register("comment")}
                ></textarea>
              </div>
            </div>
            <div className="form-footer">
              <button type="submit" className="cart-submit-btn" disabled={submissionStatus === 'submitting'}>
                {submissionStatus === 'submitting' ? 'Отправка...' : <><ArrowIconButton /><span>оставить заявку</span></>}
              </button>
              {submissionError && <p className="submission-error-message">{submissionError}</p>}
              <p className="privacy-policy">
                Нажимая на кнопку "Отправить" вы соглашаетесь на обработку своих персональных данных и на условия политики конфиденциальности
              </p>
              <p className="captcha-info">Мы используем Яндекс.Капчу</p>
            </div>
          </form>

          {/* View 3: Thank You */}
          <div className="thank-you-container-view">
            <ThankYouView onClose={handleClose} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default Cart; 