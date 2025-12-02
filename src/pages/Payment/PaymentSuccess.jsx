import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Payment.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any remaining payment data
    localStorage.removeItem('paymentIntent');
    localStorage.removeItem('orderDetails');
  }, []);

  return (
    <div className="payment-container">
      <div className="payment-success">
        <h1>Payment Successful!</h1>
        <p>Thank you for your order. Your payment has been processed successfully.</p>
        <p>We'll send you an email confirmation with your order details.</p>
        <button 
          onClick={() => navigate('/')}
          className="payment-button"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess; 