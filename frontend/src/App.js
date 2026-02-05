import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import './App.css';

Chart.register(...registerables);

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

function App() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ by_status: [], totals: {} });
  const [socket, setSocket] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    status: 'new',
    description: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState('');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('product_created', (product) => {
      setProducts(prev => [product, ...prev]);
      showNotification(`New product added: ${product.name}`);
      fetchStats();
    });

    socket.on('product_updated', (product) => {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      showNotification(`Product updated: ${product.name}`);
      fetchStats();
    });

    socket.on('product_status_updated', (product) => {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      showNotification(`Status changed: ${product.name} → ${product.status}`);
      fetchStats();
    });

    socket.on('product_deleted', (data) => {
      setProducts(prev => prev.filter(p => p.id !== data.id));
      showNotification(`Product deleted`);
      fetchStats();
    });

    return () => {
      socket.off('product_created');
      socket.off('product_updated');
      socket.off('product_status_updated');
      socket.off('product_deleted');
    };
  }, [socket]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  // Update chart whenever stats change
  useEffect(() => {
    if (chartRef.current && stats.by_status.length > 0) {
      // Destroy previous chart instance
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      
      const statusData = stats.by_status.reduce((acc, stat) => {
        acc[stat.status] = stat.count;
        return acc;
      }, {});

      const allStatuses = ['new', 'sold', 'shipped', 'delivered', 'cancelled'];
      const counts = allStatuses.map(status => statusData[status] || 0);
      const colors = {
        new: '#3b82f6',
        sold: '#f59e0b',
        shipped: '#8b5cf6',
        delivered: '#10b981',
        cancelled: '#ef4444'
      };

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['New', 'Sold', 'Shipped', 'Delivered', 'Cancelled'],
          datasets: [{
            label: 'Products Count',
            data: counts,
            backgroundColor: allStatuses.map(s => colors[s]),
            borderColor: allStatuses.map(s => colors[s]),
            borderWidth: 2,
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Products by Status (Real-time)',
              font: {
                size: 18,
                weight: 'bold'
              },
              padding: 20
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              },
              grid: {
                color: '#f3f4f6'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          },
          animation: {
            duration: 750,
            easing: 'easeInOutQuart'
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [stats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/products/${editingId}`, formData);
        setEditingId(null);
      } else {
        await axios.post(`${API_URL}/products`, formData);
      }
      setFormData({ name: '', price: '', status: 'new', description: '' });
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      status: product.status,
      description: product.description || ''
    });
    setEditingId(product.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API_URL}/products/${id}`);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(`${API_URL}/products/${id}/status`, { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', status: 'new', description: '' });
  };

  const getStatusColor = (status) => {
    const colors = {
      new: '#3b82f6',
      sold: '#f59e0b',
      shipped: '#8b5cf6',
      delivered: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="App">
      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}

      <header className="header">
        <h1>📦 Product Dashboard</h1>
        <div className="connection-status">
          {socket?.connected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </header>

      <div className="container">
        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Products</h3>
            <p className="stat-value">{stats.totals.total_products || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Value</h3>
            <p className="stat-value">${parseFloat(stats.totals.total_value || 0).toFixed(2)}</p>
          </div>
          {stats.by_status.map(stat => (
            <div className="stat-card" key={stat.status}>
              <h3 style={{ color: getStatusColor(stat.status) }}>
                {stat.status.toUpperCase()}
              </h3>
              <p className="stat-value">{stat.count}</p>
              <p className="stat-subtitle">${parseFloat(stat.total_value || 0).toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Real-time Chart */}
        <div className="chart-container">
          <canvas ref={chartRef} id="productChart"></canvas>
        </div>

        {/* Form */}
        <div className="form-container">
          <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="new">New</option>
                <option value="sold">Sold</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Product' : 'Add Product'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="btn-secondary">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Products Table */}
        <div className="table-container">
          <h2>Products ({products.length})</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Status</th>
                <th>Description</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td><strong>{product.name}</strong></td>
                  <td>${product.price}</td>
                  <td>
                    <select
                      value={product.status}
                      onChange={(e) => handleStatusChange(product.id, e.target.value)}
                      className="status-select"
                      style={{ backgroundColor: getStatusColor(product.status) }}
                    >
                      <option value="new">New</option>
                      <option value="sold">Sold</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="description">{product.description}</td>
                  <td>{new Date(product.created_at).toLocaleDateString()}</td>
                  <td className="actions">
                    <button onClick={() => handleEdit(product)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="btn-delete">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;