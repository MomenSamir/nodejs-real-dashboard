-- Create database
CREATE DATABASE IF NOT EXISTS node_dashboard;

USE node_dashboard;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status ENUM('new', 'sold', 'shipped', 'delivered', 'cancelled') DEFAULT 'new',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO products (name, price, status, description) VALUES
('Laptop Dell XPS 13', 1299.99, 'new', 'High-performance ultrabook'),
('iPhone 15 Pro', 999.99, 'sold', 'Latest Apple smartphone'),
('Sony WH-1000XM5', 399.99, 'shipped', 'Noise-cancelling headphones'),
('Samsung Galaxy S24', 899.99, 'new', 'Flagship Android phone'),
('MacBook Pro 16"', 2499.99, 'delivered', 'Professional laptop for creators'),
('AirPods Pro', 249.99, 'new', 'Premium wireless earbuds'),
('iPad Air', 599.99, 'sold', 'Versatile tablet'),
('Nintendo Switch', 299.99, 'shipped', 'Gaming console');
