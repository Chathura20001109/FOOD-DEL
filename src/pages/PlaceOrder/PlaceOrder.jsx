import React, { useContext, useState } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import "./PlaceOrder.css";

const PlaceOrder = () => {
  const { getTotalCartAmount, API_URL, checkServerConnection } = useContext(StoreContext);
  const navigate = useNavigate();
  const totalAmount = getTotalCartAmount();
  const deliveryFee = totalAmount > 0 ? 2 : 0;
  const finalAmount = totalAmount + deliveryFee;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Check server connection first
      const isConnected = await checkServerConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to the server. Please try again later.');
      }

      // Create payment intent
      const response = await fetch(`${API_URL}/api/payment/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          amount: finalAmount,
          currency: 'usd',
          customerDetails: formData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment intent');
      }

      const data = await response.json();
      console.log('Payment intent response:', data);

      if (!data.clientSecret) {
        throw new Error('No client secret received from server');
      }

      // Store the client secret and order details in localStorage
      localStorage.setItem('paymentIntent', data.clientSecret);
      localStorage.setItem('orderDetails', JSON.stringify({
        ...formData,
        amount: finalAmount,
        items: getTotalCartAmount()
      }));

      // Redirect to payment page
      navigate('/payment');
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Error processing payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="place-order" onSubmit={handleSubmit}>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input 
            type="text" 
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First name" 
            required 
          />
          <input 
            type="text" 
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last name" 
            required 
          />
        </div>
        <input 
          type="email" 
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email address" 
          required 
        />
        <input 
          type="text" 
          name="street"
          value={formData.street}
          onChange={handleChange}
          placeholder="Street" 
          required 
        />
        <div className="multi-fields">
          <input 
            type="text" 
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City" 
            required 
          />
          <input 
            type="text" 
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="State" 
            required 
          />
        </div>
        <div className="multi-fields">
          <input 
            type="text" 
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            placeholder="Zip code" 
            required 
          />
          <input 
            type="text" 
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder="Country" 
            required 
          />
        </div>
        <input 
          type="text" 
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone" 
          required 
        />
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>$ {totalAmount}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>$ {deliveryFee}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>$ {finalAmount}</b>
            </div>
          </div>
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
              {error}
            </div>
          )}
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Processing...' : 'PROCEED TO PAYMENT'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
