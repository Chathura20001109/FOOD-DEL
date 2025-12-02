import React, { useState, useContext } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const { cartItems } = useContext(StoreContext);

  // Calculate total cart items
  const totalCartItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

  // Function to handle smooth scrolling
  const handleScrollTo = (id, menuName) => {
    setMenu(menuName);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="navbar">
      <Link to="/">
        <img src={assets.logo} alt="Logo" className="logo" />
      </Link>

      <ul className="navbar-menu">
        <Link
          to="/"
          className={menu === "home" ? "active" : ""}
          onClick={() => setMenu("home")}
        >
          Home
        </Link>
        <span
          className={menu === "menu" ? "active" : ""}
          onClick={() => handleScrollTo("explore-menu", "menu")}
        >
          Menu
        </span>
        <span
          className={menu === "mobile-app" ? "active" : ""}
          onClick={() => handleScrollTo("app-download", "mobile-app")}
        >
          Mobile App
        </span>
        <span
          className={menu === "contact-us" ? "active" : ""}
          onClick={() => handleScrollTo("footer", "contact-us")}
        >
          Contact Us
        </span>
      </ul>

      <div className="navbar-right">
        <img src={assets.search_icon} alt="Search" />

        <div className="navbar-search-icon">
          <Link to="/cart">
            <img src={assets.basket_icon} alt="Basket" />
            {totalCartItems > 0 && <div className="dot">{totalCartItems}</div>}
          </Link>
        </div>

        <button onClick={() => setShowLogin(true)}>Sign In</button>
      </div>
    </div>
  );
};

export default Navbar;
