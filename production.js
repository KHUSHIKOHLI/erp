import express from 'express';
import pool from '../config/database.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Get all production records
router.get('/', async (req, res) => {
  try {
    const [production] = await pool.query(`
      SELECT pr.*, p.product_name, p.category
      FROM production pr
      JOIN products p ON pr.product_id = p.product_id
      ORDER BY pr.production_date DESC
    `);
    
    res.status(200).json({
      status: 'success',
      data: production
    });
  } catch (error) {
    console.error('Error fetching production records:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch production records'
    });
  }
});

// Get production record by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [production] = await pool.query(`
      SELECT pr.*, p.product_name, p.category, p.price, p.stock_quantity
      FROM production pr
      JOIN products p ON pr.product_id = p.product_id
      WHERE pr.production_id = ?
    `, [id]);
    
    if (production.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Production record not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: production[0]
    });
  } catch (error) {
    console.error('Error fetching production record:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch production record'
    });
  }
});

// Create a new production record
router.post('/', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { product_id, production_date, quantity_produced, status } = req.body;
    
    if (!product_id || !quantity_produced || !status) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        status: 'error',
        message: 'Product ID, quantity produced, and status are required'
      });
    }
    
    // Check if product exists
    const [products] = await connection.query('SELECT * FROM products WHERE product_id = ?', [product_id]);
    
    if (products.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    // Use today's date if not provided
    const date = production_date || new Date().toISOString().slice(0, 10);
    
    const [result] = await connection.query(
      'INSERT INTO production (product_id, production_date, quantity_produced, status) VALUES (?, ?, ?, ?)',
      [product_id, date, quantity_produced, status]
    );
    
    // Update product stock if production is completed
    if (status === 'Completed') {
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?',
        [quantity_produced, product_id]
      );
    }
    
    await connection.commit();
    
    res.status(201).json({
      status: 'success',
      message: 'Production record created successfully',
      data: {
        production_id: result.insertId,
        product_id,
        production_date: date,
        quantity_produced,
        status
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error creating production record:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create production record'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Update a production record
router.put('/:id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { production_date, quantity_produced, status } = req.body;
    
    if (!production_date || !quantity_produced || !status) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        status: 'error',
        message: 'Production date, quantity produced, and status are required'
      });
    }
    
    // Get current production record
    const [productions] = await connection.query('SELECT * FROM production WHERE production_id = ?', [id]);
    
    if (productions.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        status: 'error',
        message: 'Production record not found'
      });
    }
    
    const currentProduction = productions[0];
    
    // Update production record
    const [result] = await connection.query(
      'UPDATE production SET production_date = ?, quantity_produced = ?, status = ? WHERE production_id = ?',
      [production_date, quantity_produced, status, id]
    );
    
    // Update product stock if status changed
    if (currentProduction.status !== 'Completed' && status === 'Completed') {
      // Add stock when status changes to Completed
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?',
        [quantity_produced, currentProduction.product_id]
      );
    } else if (currentProduction.status === 'Completed' && status !== 'Completed') {
      // Remove stock when status changes from Completed
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
        [currentProduction.quantity_produced, currentProduction.product_id]
      );
    } else if (currentProduction.status === 'Completed' && status === 'Completed' && 
              currentProduction.quantity_produced !== parseInt(quantity_produced)) {
      // Adjust stock if quantity changed while status remains Completed
      const quantityDiff = parseInt(quantity_produced) - currentProduction.quantity_produced;
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?',
        [quantityDiff, currentProduction.product_id]
      );
    }
    
    await connection.commit();
    
    res.status(200).json({
      status: 'success',
      message: 'Production record updated successfully',
      data: {
        production_id: parseInt(id),
        product_id: currentProduction.product_id,
        production_date,
        quantity_produced,
        status
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error updating production record:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update production record'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Delete a production record
router.delete('/:id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Get current production record
    const [productions] = await connection.query('SELECT * FROM production WHERE production_id = ?', [id]);
    
    if (productions.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        status: 'error',
        message: 'Production record not found'
      });
    }
    
    const production = productions[0];
    
    // If the status is Completed, reduce the product stock
    if (production.status === 'Completed') {
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
        [production.quantity_produced, production.product_id]
      );
      
      // Check if stock would become negative
      const [products] = await connection.query('SELECT stock_quantity FROM products WHERE product_id = ?', [production.product_id]);
      if (products[0].stock_quantity < 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete production record. It would result in negative stock.'
        });
      }
    }
    
    // Delete production record
    const [result] = await connection.query('DELETE FROM production WHERE production_id = ?', [id]);
    
    await connection.commit();
    
    res.status(200).json({
      status: 'success',
      message: 'Production record deleted successfully'
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error deleting production record:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete production record'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Get production records by product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const [production] = await pool.query(
      'SELECT * FROM production WHERE product_id = ? ORDER BY production_date DESC',
      [productId]
    );
    
    res.status(200).json({
      status: 'success',
      data: production
    });
  } catch (error) {
    console.error('Error fetching production records by product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch production records'
    });
  }
});

export default router;