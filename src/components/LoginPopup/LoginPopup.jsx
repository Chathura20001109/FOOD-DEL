import React, { useState, useContext } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";

const LoginPopup = ({ setShowLogin }) => {
  const { API_URL } = useContext(StoreContext);
  const [currState, setCurrState] = useState("Login");
  const [data, setData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear error when user types
  };

  const onLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate inputs
      if (!data.email || !data.password) {
        throw new Error("Please fill in all fields");
      }

      if (currState === "Sign Up" && !data.name) {
        throw new Error("Please enter your name");
      }

      if (!data.email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      // Check server connection first
      try {
        await axios.get(`${API_URL}/api/health`);
      } catch (err) {
        throw new Error("Cannot connect to the server. Please try again later.");
      }

      const endpoint = currState === "Login" ? "/api/user/login" : "/api/user/register";
      const response = await axios.post(`${API_URL}${endpoint}`, data);

      if (response.data.token) {
        // Store token and user data
        localStorage.setItem("token", response.data.token);
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }
        setShowLogin(false);
        window.location.reload(); // Refresh to update auth state
      } else {
        throw new Error("No authentication token received");
      }
    } catch (error) {
      console.error("Login/Register error:", error);
      setError(error.response?.data?.message || error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="Close" />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="login-popup-inputs">
          {currState === "Sign Up" && (
            <input
              type="text"
              name="name"
              onChange={onChangeHandler}
              value={data.name}
              placeholder="Your name"
              required
              disabled={loading}
            />
          )}
          <input
            type="email"
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            placeholder="Your email"
            required
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            placeholder="Password"
            required
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : currState === "Sign Up" ? "Create account" : "Login"}
        </button>

        <div className="login-popup-condition">
          <input type="checkbox" required disabled={loading} />
          <p>By continuing, I agree to the Terms of Use & Privacy Policy.</p>
        </div>

        {currState === "Login" ? (
          <p>
            Create a new account?{" "}
            <span onClick={() => setCurrState("Sign Up")}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <span onClick={() => setCurrState("Login")}>Login here</span>
          </p>
        )}

        <button 
          type="button" 
          className="close-btn" 
          onClick={() => setShowLogin(false)}
          disabled={loading}
        >
          Close
        </button>
      </form>
    </div>
  );
};

export default LoginPopup;
