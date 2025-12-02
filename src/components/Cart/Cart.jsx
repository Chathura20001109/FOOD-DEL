import React, { useContext } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const { cartItems, food_list, addToCart, removeFromCart, getTotalCartAmount } =
    useContext(StoreContext);

  const navigate = useNavigate();
  const totalAmount = getTotalCartAmount();

  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Image</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <hr />
        {food_list.map((item) => {
          if (cartItems[item._id] > 0) {
            return (
              <div key={item._id} className="cart-items-title cart-items-item">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="cart-item-image"
                  onClick={() => addToCart(item._id)} 
                  style={{ cursor: "pointer" }} 
                />
                <p>{item.name}</p>
                <p>$ {item.price}</p>
                <p>{cartItems[item._id]}</p>
                <p>$ {item.price * cartItems[item._id]}</p>
                <p
                  onClick={() => removeFromCart(item._id)}
                  className="cross"
                  style={{ cursor: "pointer" }}
                >
                  x
                </p>
                <hr />
              </div>
            );
          }
          return null;
        })}
      </div>

      <div className="cart-bottom">
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
              <p>{totalAmount > 0 ? "$ 2" : "$ 0"}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>$ {totalAmount > 0 ? totalAmount + 2 : 0}</b>
            </div>
          </div>
          <button onClick={() => navigate("/placeorder")}>
            PROCEED TO CHECKOUT
          </button>
        </div>
        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, enter it here</p>
            <div className="cart-promocode-input">
              <input type="text" placeholder="Promo Code" />
              <button>Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
