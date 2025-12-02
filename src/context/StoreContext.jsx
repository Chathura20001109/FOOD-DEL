import { createContext, useState } from "react";
import { food_list } from "../assets/assets";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const getDefaultCart = () => {
    let cart = {};
    food_list.forEach((item) => {
      cart[item._id] = 0;
    });
    return cart;
  };

  const [cartItems, setCartItems] = useState(getDefaultCart());
  const API_URL = "http://localhost:3000";

  // Add a function to check server connection
  const checkServerConnection = async () => {
    try {
      console.log('Checking server connection to:', API_URL);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      // Try to connect to the health endpoint directly
      const response = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Server health check failed:', response.status);
        return false;
      }

      let data;
      try {
        const text = await response.text();
        console.log('Raw response:', text);
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Error parsing server response:', parseError);
        return false;
      }

      console.log('Server health check response:', data);
      
      if (!data || data.status !== 'ok' || data.mongodb !== 'connected') {
        console.error('Server health check indicates issues:', data);
        return false;
      }

      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Server connection timeout');
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('Network error - server might be down');
        console.error('Please ensure the backend server is running at:', API_URL);
      } else {
        console.error('Error checking server connection:', error);
      }
      return false;
    }
  };

  // Add a function to retry server connection
  const retryServerConnection = async (maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      console.log(`Attempting to connect to server (attempt ${i + 1}/${maxRetries})...`);
      try {
        const connected = await checkServerConnection();
        if (connected) {
          console.log('Successfully connected to server');
          return true;
        }
      } catch (error) {
        console.error(`Connection attempt ${i + 1} failed:`, error);
      }
      
      if (i < maxRetries - 1) {
        console.log('Waiting 2 seconds before retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    console.error('Failed to connect to server after', maxRetries, 'attempts');
    return false;
  };

  const addToCart = (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => {
      if (!prev[itemId]) return prev;

      const updatedCart = { ...prev };
      updatedCart[itemId]--;

      if (updatedCart[itemId] <= 0) updatedCart[itemId] = 0;
      return updatedCart;
    });
  };

  const getTotalCartAmount = () => {
    return Object.keys(cartItems).reduce((total, itemId) => {
      const item = food_list.find((food) => String(food._id) === String(itemId));
      return item ? total + item.price * cartItems[itemId] : total;
    }, 0);
  };

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    API_URL,
    checkServerConnection,
    retryServerConnection
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
