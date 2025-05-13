import express from 'express';
import pool from '../config/database.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Get all products
router.get('/', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products ORDER BY product_name');
    res.status(200).json({
      status: 'success',
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products'
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [products] = await pool.query('SELECT * FROM products WHERE product_id = ?', [id]);
    
    if (products.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: products[0]
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product'
    });
  }
});

// Create a new product
router.post('/', async (req, res) => {
  try {
    const { product_name, category, price, stock_quantity } = req.body;
    
    if (!product_name || !category || !price) {
      return res.status(400).json({
        status: 'error',
        message: 'Product name, category, and price are required'
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO products (product_name, category, price, stock_quantity) VALUES (?, ?, ?, ?)',
      [product_name, category, price, stock_quantity || 0]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: {
        product_id: result.insertId,
        product_name,
        category,
        price,
        stock_quantity: stock_quantity || 0
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create product'
    });
  }
});

// Update a product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, category, price, stock_quantity } = req.body;
    
    if (!product_name || !category || !price) {
      return res.status(400).json({
        status: 'error',
        message: 'Product name, category, and price are required'
      });
    }
    
    const [result] = await pool.query(
      'UPDATE products SET product_name = ?, category = ?, price = ?, stock_quantity = ? WHERE product_id = ?',
      [product_name, category, price, stock_quantity || 0, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully',
      data: {
        product_id: parseInt(id),
        product_name,
        category,
        price,
        stock_quantity: stock_quantity || 0
      }
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update product'
    });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product is used in any order
    const [orderItems] = await pool.query('SELECT * FROM order_items WHERE product_id = ?', [id]);
    
    if (orderItems.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete product that is used in orders'
      });
    }
    
    // Check if product has production records
    const [production] = await pool.query('SELECT * FROM production WHERE product_id = ?', [id]);
    
    if (production.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete product that has production records'
      });
    }
    
    const [result] = await pool.query('DELETE FROM products WHERE product_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete product'
    });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const [products] = await pool.query(
      'SELECT * FROM products WHERE category = ? ORDER BY product_name',
      [category]
    );
    
    res.status(200).json({
      status: 'success',
      data: products
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products'
    });
  }
});

// Get low stock products
router.get('/stock/low', async (req, res) => {
  try {
    const threshold = req.query.threshold || 10;
    
    const [products] = await pool.query(
      'SELECT * FROM products WHERE stock_quantity < ? ORDER BY stock_quantity',
      [threshold]
    );
    
    res.status(200).json({
      status: 'success',
      data: products
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch low stock products'
    });
  }
});

export default router;