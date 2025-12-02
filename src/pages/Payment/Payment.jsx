import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from './PaymentForm';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    // Load Stripe
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('Stripe publishable key is missing');
      return;
    }

    const stripePromise = loadStripe(publishableKey);
    setStripePromise(stripePromise);

    // Get stored payment intent and order details
    const storedClientSecret = localStorage.getItem('paymentIntent');
    const storedOrderDetails = localStorage.getItem('orderDetails');

    if (!storedClientSecret || !storedOrderDetails) {
      navigate('/placeorder');
      return;
    }

    setClientSecret(storedClientSecret);
    setOrderDetails(JSON.parse(storedOrderDetails));
  }, [navigate]);

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#ff6347',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '4px',
    },
  };

  if (!stripePromise || !clientSecret) {
    return <div className="payment-loading">Loading...</div>;
  }

  return (
    <div className="payment-container">
      <h1>Complete Your Payment</h1>
      {orderDetails && (
        <div className="order-summary">
          <h2>Order Summary</h2>
          <p>Total Amount: ${orderDetails.amount}</p>
          <p>Delivery Address: {orderDetails.street}, {orderDetails.city}, {orderDetails.state} {orderDetails.zipCode}</p>
        </div>
      )}
      <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
        <PaymentForm />
      </Elements>
    </div>
  );
};

export default Payment; 