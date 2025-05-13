import express from 'express';
import pool from '../config/database.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Get all customers
router.get('/', async (req, res) => {
  try {
    const [customers] = await pool.query('SELECT * FROM customers');
    res.status(200).json({
      status: 'success',
      data: customers
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customers'
    });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [customers] = await pool.query('SELECT * FROM customers WHERE customer_id = ?', [id]);
    
    if (customers.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: customers[0]
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customer'
    });
  }
});

// Create a new customer
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone } = req.body;
    
    if (!first_name || !last_name || !email || !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO customers (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)',
      [first_name, last_name, email, phone]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'Customer created successfully',
      data: {
        customer_id: result.insertId,
        first_name,
        last_name,
        email,
        phone
      }
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create customer'
    });
  }
});

// Update a customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone } = req.body;
    
    if (!first_name || !last_name || !email || !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }
    
    const [result] = await pool.query(
      'UPDATE customers SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE customer_id = ?',
      [first_name, last_name, email, phone, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Customer updated successfully',
      data: {
        customer_id: parseInt(id),
        first_name,
        last_name,
        email,
        phone
      }
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update customer'
    });
  }
});

// Delete a customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if customer has related orders
    const [orders] = await pool.query('SELECT * FROM orders WHERE customer_id = ?', [id]);
    
    if (orders.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete customer with existing orders'
      });
    }
    
    const [result] = await pool.query('DELETE FROM customers WHERE customer_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete customer'
    });
  }
});

// Get customer orders
router.get('/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if customer exists
    const [customers] = await pool.query('SELECT * FROM customers WHERE customer_id = ?', [id]);
    
    if (customers.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }
    
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC',
      [id]
    );
    
    res.status(200).json({
      status: 'success',
      data: orders
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customer orders'
    });
  }
});

export default router;