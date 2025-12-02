import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './List.css';

const List = ({url}) => {
    // Backend API URL
  const [list, setList] = useState([]);

  // Fetch food items when the component mounts
  const fetchList = async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`);
      setList(response.data);
    } catch (err) {
      console.error('Error fetching food list:', err);
    }
  };

  // Delete food item
  const deleteFood = async (id) => {
    try {
      const response = await axios.delete(`${url}/api/food/${id}`);
      if (response.data.message === 'Food deleted') {
        alert('Food deleted');
        fetchList();  // Re-fetch the list after deletion
      } else {
        alert('Delete failed');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting food');
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="list">
      <h2>Food Items</h2>
      <div className="list-table">
        <div className="list-table-header">
          <div className="list-header-item">Image</div>
          <div className="list-header-item">Name</div>
          <div className="list-header-item">Category</div>
          <div className="list-header-item">Price</div>
          <div className="list-header-item">Action</div>
        </div>

        {list.length === 0 ? (
          <p className="empty-msg">No food items found.</p>
        ) : (
          list.map((item) => (
            <div key={item._id} className="list-table-row">
              <div className="list-item-image">
                <img src={`${url}/images/${item.image}`} alt={item.name} />
              </div>
              <div className="list-item-name">{item.name}</div>
              <div className="list-item-category">{item.category}</div>
              <div className="list-item-price">${item.price}</div>
              <div className="list-item-action">
                <button className="delete-btn" onClick={() => deleteFood(item._id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default List;
