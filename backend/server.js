const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(products[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, status, description } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO products (name, price, status, description) VALUES (?, ?, ?, ?)',
      [name, price, status || 'new', description]
    );

    const [newProduct] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    
    // Emit real-time event
    io.emit('product_created', newProduct[0]);
    
    res.status(201).json(newProduct[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price, status, description } = req.body;
    const { id } = req.params;

    await db.query(
      'UPDATE products SET name = ?, price = ?, status = ?, description = ? WHERE id = ?',
      [name, price, status, description, id]
    );

    const [updatedProduct] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (updatedProduct.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Emit real-time event
    io.emit('product_updated', updatedProduct[0]);
    
    res.json(updatedProduct[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Update product status only (for quick status changes)
app.patch('/api/products/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    await db.query('UPDATE products SET status = ? WHERE id = ?', [status, id]);

    const [updatedProduct] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (updatedProduct.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Emit real-time event
    io.emit('product_status_updated', updatedProduct[0]);
    
    res.json(updatedProduct[0]);
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ error: 'Failed to update product status' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM products WHERE id = ?', [id]);

    // Emit real-time event
    io.emit('product_deleted', { id: parseInt(id) });
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get product statistics
app.get('/api/stats', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(price) as total_value
      FROM products 
      GROUP BY status
    `);
    
    const [totals] = await db.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(price) as total_value
      FROM products
    `);

    res.json({
      by_status: stats,
      totals: totals[0]
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
