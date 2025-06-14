import React from "react";
import FormSentIcon from "./assets/form-sent-icon";

const ThankYouView = ({ onClose }) => {
  return (
    <div className="thank-you-view">
      <button className="cart-close" onClick={onClose}>
        ×
      </button>
      <div className="thank-you-content">
        <div className="thank-you-content-inner">
          <h3 className="thank-you-content-inner-title">Спасибо! Ваша заявка успешно отправлена</h3>
          <p className="thank-you-content-inner-text">
            В течение одного рабочего дня наши менеджеры свяжутся с вами по
            указанным контактам для уточнения деталей заказа и расскажут вам о
            доступных условиях сотрудничества
          </p>
        </div>
          <FormSentIcon className="thank-you-content-icon" />
      </div>
    </div>
  );
};

export default ThankYouView;
