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
  onClearCart
}) => {
  const [activeView, setActiveView] = useState('cart'); // 'cart', 'form', 'success'
  const [submissionStatus, setSubmissionStatus] = useState('idle'); // 'idle', 'submitting'
  
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

    const payload = {
      contactInfo: data,
      order: cartItems.map(item => ({
        productName: item.productName,
        certificateNumber: item.certificateNumber,
        quantity: item.quantity
      }))
    };

    console.log("Отправляемые данные:", JSON.stringify(payload, null, 2));

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setActiveView('success');
      onClearCart();
      reset(); // Сбрасываем поля формы
    } catch (error) {
      console.error("Ошибка отправки:", error);
      // Можно было бы установить глобальную ошибку здесь
    } finally {
      setSubmissionStatus('idle');
    }
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
                      <div key={item.certificateNumber} className="cart-item">
                        <div className="cart-item-info">
                          <div className="cart-item-name">{item.productName}</div>
                        </div>
                        <div className="cart-item-controls">
                          <button
                            className="cart-qty-btn minus"
                            onClick={() => onUpdateCount(item.certificateNumber, false)}
                          >
                            −
                          </button>
                          <span className="cart-qty-display">
                            {item.quantity}
                          </span>
                          <button
                            className="cart-qty-btn plus"
                            onClick={() => onUpdateCount(item.certificateNumber, true)}
                          >
                            +
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
              <button type="button" className="back-btn" onClick={() => setActiveView('cart')}>
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