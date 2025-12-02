import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Add.css'; // Import the CSS file

const Add = ({url}) => {
  const navigate = useNavigate();
   // Change to your server URL if needed

  const [image, setImage] = useState(null);
  const [data, setData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Salad',  // Default category
  });

  // Handle input changes
  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image file change
  const onFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  // Handle form submission
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!image) {
      alert('Please upload an image.');
      return;
    }

    try {
      // Prepare form data for sending to the backend
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', data.price);
      formData.append('category', data.category);
      formData.append('image', image);  // Attach image file

      // Make the POST request to the backend
      const res = await axios.post(`${url}/api/food`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.status === 201) {
        alert('Product added successfully!');
        setData({
          name: '',
          description: '',
          price: '',
          category: 'Salad',
        });
        setImage(null);
        navigate('/list');  // Redirect to the food list page
      } else {
        alert(res.data.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error('Error uploading product:', err);
      alert('Error uploading product.');
    }
  };

  return (
    <div className="add">
      <h2>Add New Food Item</h2>
      <form onSubmit={onSubmitHandler}>
        {/* Image Upload Section */}
        <div className="add-img-upload">
          <label htmlFor="image">
            <img
              src={image ? URL.createObjectURL(image) : 'https://via.placeholder.com/120'}
              alt="Upload Preview"
            />
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={onFileChange}
            required
            hidden
          />
        </div>

        {/* Product Name */}
        <div className="add-product-name">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={data.name}
            onChange={onChangeHandler}
            required
          />
        </div>

        {/* Product Description */}
        <div className="add-product-description">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={data.description}
            onChange={onChangeHandler}
            required
          />
        </div>

        {/* Category and Price */}
        <div className="add-category-price">
          {/* Category Select */}
          <div className="add-category">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={data.category}
              onChange={onChangeHandler}
              required
            >
              <option value="Salad">Salad</option>
              <option value="Pizza">Pizza</option>
              <option value="Beverage">Beverage</option>
            </select>
          </div>

          {/* Price Input */}
          <div className="add-price">
            <label htmlFor="price">Price</label>
            <input
              type="number"
              id="price"
              name="price"
              value={data.price}
              onChange={onChangeHandler}
              required
              min="0"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="add-button-wrapper">
          <button type="submit" className="add-button">
            Add Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default Add;
