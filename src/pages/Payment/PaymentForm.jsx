import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with error handling and security checks
const stripePromise = (() => {
  try {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('Stripe publishable key is missing. Please check your .env file.');
      return null;
    }

    // Validate key format
    if (!publishableKey.startsWith('pk_test_') && !publishableKey.startsWith('pk_live_')) {
      console.error('Invalid Stripe publishable key format');
      return null;
    }

    // Check if we're in development or production
    const isDevelopment = import.meta.env.DEV;
    const isSecure = window.location.protocol === 'https:';
    
    if (!isDevelopment && !isSecure) {
      console.warn('Stripe.js should be used over HTTPS in production');
    }

    // For development, we'll allow HTTP but warn about Apple Pay/Google Pay
    if (isDevelopment && !isSecure) {
      console.warn('Apple Pay and Google Pay will not work over HTTP. Please use HTTPS for testing these payment methods.');
    }

    console.log('Initializing Stripe with key:', publishableKey.substring(0, 10) + '...');
    return loadStripe(publishableKey);
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    return null;
  }
})();

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { API_URL, checkServerConnection, retryServerConnection } = useContext(StoreContext);
  const [errorMessage, setErrorMessage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [stripeError, setStripeError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSecure, setIsSecure] = useState(window.location.protocol === 'https:');
  const [elementsInstance, setElementsInstance] = useState(null);
  const [isElementMounted, setIsElementMounted] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);

  // Check server connection and Stripe initialization
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!stripePromise) {
          setStripeError('Stripe initialization failed. Please check your environment variables.');
          return;
        }

        // Check if we're in development mode
        const isDevelopment = import.meta.env.DEV;
        if (!isDevelopment && !isSecure) {
          setStripeError('Stripe requires HTTPS in production. Please use a secure connection.');
          return;
        }

        const connected = await checkServerConnection();
        setIsConnected(connected);
        
        if (!connected) {
          setErrorMessage('Cannot connect to the server. Please try again later.');
        } else {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setErrorMessage('Failed to initialize payment system. Please refresh the page.');
      }
    };

    initialize();
  }, [checkServerConnection, isSecure]);

  // Add useEffect to handle Elements initialization
  useEffect(() => {
    let paymentElement = null;

    const initializeElements = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setErrorMessage('Please log in to continue with payment');
          navigate('/login');
          return;
        }

        // Get order details first
        const orderDetailsStr = localStorage.getItem('orderDetails');
        if (!orderDetailsStr) {
          setErrorMessage('Order details not found. Please try adding items to your cart again.');
          return;
        }

        let orderDetails;
        try {
          orderDetails = JSON.parse(orderDetailsStr);
        } catch (parseError) {
          console.error('Error parsing order details:', parseError);
          setErrorMessage('Invalid order details format. Please try again.');
          return;
        }

        // Get total amount from order details
        const totalAmount = orderDetails.totalAmount || orderDetails.amount;
        if (!totalAmount || isNaN(totalAmount) || totalAmount <= 0) {
          setErrorMessage('Invalid order amount. Please try adding items to your cart again.');
          return;
        }

        // Add retry logic for payment intent creation
        let retries = 3;
        let lastError = null;

        while (retries > 0) {
          try {
            // Create payment intent first
            const createIntentResponse = await fetch(`${API_URL}/api/payment/create-payment-intent`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                amount: Math.round(totalAmount * 100), // Convert to cents for Stripe
                currency: 'usd',
                customerDetails: {
                  email: orderDetails.email,
                  firstName: orderDetails.firstName,
                  lastName: orderDetails.lastName,
                  street: orderDetails.street,
                  city: orderDetails.city,
                  state: orderDetails.state,
                  zipCode: orderDetails.zipCode,
                  country: orderDetails.country,
                  phone: orderDetails.phone
                }
              })
            });

            if (!createIntentResponse.ok) {
              if (createIntentResponse.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                setErrorMessage('Your session has expired. Please log in again.');
                navigate('/login');
                return;
              }
              const errorData = await createIntentResponse.json();
              throw new Error(errorData.message || 'Failed to create payment intent');
            }

            const { clientSecret: newClientSecret } = await createIntentResponse.json();
            console.log('Payment intent created successfully');
            setClientSecret(newClientSecret);

            // Wait for the DOM element to be available
            const elementContainer = document.getElementById('payment-element');
            if (!elementContainer) {
              console.error('Payment element container not found');
              return;
            }

            // Initialize Elements with the client secret
            const newElementsInstance = stripe.elements({
              clientSecret: newClientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#0570de',
                  colorBackground: '#ffffff',
                  colorText: '#30313d',
                  colorDanger: '#df1b41',
                  fontFamily: 'Ideal Sans, system-ui, sans-serif',
                  spacingUnit: '4px',
                  borderRadius: '4px'
                }
              },
              paymentMethodCreation: 'manual'
            });

            // Create and mount the Payment Element
            paymentElement = newElementsInstance.create('payment', {
              layout: {
                type: 'tabs',
                defaultCollapsed: false
              }
            });

            // Add event listener for ready state
            paymentElement.on('ready', () => {
              console.log('Payment Element is ready');
              setIsElementMounted(true);
            });

            // Add error handler
            paymentElement.on('loaderror', (event) => {
              console.error('Payment Element load error:', event);
              setErrorMessage('Failed to load payment form. Please refresh the page.');
              setIsElementMounted(false);
            });

            await paymentElement.mount('#payment-element');
            console.log('Payment Element mounted successfully');

            // Update state
            setElementsInstance(newElementsInstance);
            setIsInitialized(true);
            return; // Success, exit the function
          } catch (err) {
            lastError = err;
            console.error(`Error initializing Elements (attempt ${4 - retries}/3):`, err);
            
            if (err.message.includes('Failed to load resource') || err.message.includes('network')) {
              retries--;
              if (retries > 0) {
                // Wait for 1 second before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
            }
            
            // If it's not a network error or we're out of retries, throw the error
            throw err;
          }
        }

        // If we get here, all retries failed
        throw lastError;
      } catch (err) {
        console.error('Error initializing Elements:', err);
        setErrorMessage(err.message || 'Failed to initialize payment form. Please refresh the page.');
        setIsInitialized(false);
        setIsElementMounted(false);
      }
    };

    if (stripe && !clientSecret) {
      initializeElements();
    }

    // Cleanup function
    return () => {
      if (paymentElement) {
        paymentElement.unmount();
      }
      if (elementsInstance) {
        setElementsInstance(null);
      }
      setIsElementMounted(false);
    };
  }, [stripe, API_URL, clientSecret, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected || !isInitialized) {
      setErrorMessage('Cannot connect to the server. Please try again later.');
      return;
    }

    if (!stripe || !elementsInstance) {
      setErrorMessage('Payment system is not ready. Please refresh the page.');
      return;
    }

    if (!isElementMounted) {
      setErrorMessage('Payment form is still loading. Please wait a moment and try again.');
      return;
    }

    try {
      setProcessing(true);
      setErrorMessage(null);

      // Get the payment element
      const paymentElement = elementsInstance.getElement('payment');
      if (!paymentElement) {
        throw new Error('Payment form is not ready. Please refresh the page.');
      }

      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements: elementsInstance,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        throw error;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Clear order details from localStorage
        localStorage.removeItem('orderDetails');
        localStorage.removeItem('cartTotal');
        
        // Navigate to success page
        navigate('/payment-success');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      setErrorMessage(null);
      const connected = await retryServerConnection();
      setIsConnected(connected);
      
      if (!connected) {
        setErrorMessage('Still cannot connect to the server. Please try again later.');
      } else {
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Retry error:', error);
      setErrorMessage('Failed to reconnect. Please refresh the page.');
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="payment-error">
        <h2>Connection Error</h2>
        <p>Cannot connect to the payment server.</p>
        <button onClick={handleRetry} disabled={isRetrying}>
          {isRetrying ? 'Retrying...' : 'Retry Connection'}
        </button>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="payment-loading">
        <h2>Initializing Payment System</h2>
        <p>Please wait while we set up your payment form...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div id="payment-element" className="payment-element"></div>
      {errorMessage && <div className="payment-error">{errorMessage}</div>}
      <button 
        type="submit" 
        disabled={!stripe || !elementsInstance || !isElementMounted || processing}
      >
        {processing ? 'Processing...' : !isElementMounted ? 'Loading...' : 'Pay Now'}
      </button>
    </form>
  );
};

export default PaymentForm; 