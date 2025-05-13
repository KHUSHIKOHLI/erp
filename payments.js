import express from 'express';
import pool from '../config/database.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Get all payments
router.get('/', async (req, res) => {
  try {
    const [payments] = await pool.query(`
      SELECT p.*, o.customer_id, 
             c.first_name, c.last_name
      FROM payments p
      JOIN orders o ON p.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      ORDER BY p.payment_date DESC
    `);
    
    res.status(200).json({
      status: 'success',
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payments'
    });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [payments] = await pool.query(`
      SELECT p.*, o.customer_id, o.order_date, o.amount as order_amount,
             c.first_name, c.last_name, c.email
      FROM payments p
      JOIN orders o ON p.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      WHERE p.payment_id = ?
    `, [id]);
    
    if (payments.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: payments[0]
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payment'
    });
  }
});

// Create a new payment
router.post('/', async (req, res) => {
  try {
    const { order_id, payment_date, payment_method, amount } = req.body;
    
    if (!order_id || !payment_method || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID, payment method, and amount are required'
      });
    }
    
    // Check if order exists
    const [orders] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [order_id]);
    
    if (orders.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Use today's date if not provided
    const date = payment_date || new Date().toISOString().slice(0, 10);
    
    const [result] = await pool.query(
      'INSERT INTO payments (order_id, payment_date, payment_method, amount) VALUES (?, ?, ?, ?)',
      [order_id, date, payment_method, amount]
    );
    
    // Update invoice status if exists
    const [invoices] = await pool.query('SELECT * FROM invoices WHERE order_id = ?', [order_id]);
    if (invoices.length > 0) {
      await pool.query('UPDATE invoices SET status = "paid" WHERE order_id = ?', [order_id]);
    }
    
    res.status(201).json({
      status: 'success',
      message: 'Payment recorded successfully',
      data: {
        payment_id: result.insertId,
        order_id,
        payment_date: date,
        payment_method,
        amount
      }
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record payment'
    });
  }
});

// Update a payment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_date, payment_method, amount } = req.body;
    
    if (!payment_date || !payment_method || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment date, payment method, and amount are required'
      });
    }
    
    const [result] = await pool.query(
      'UPDATE payments SET payment_date = ?, payment_method = ?, amount = ? WHERE payment_id = ?',
      [payment_date, payment_method, amount, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Payment updated successfully',
      data: {
        payment_id: parseInt(id),
        payment_date,
        payment_method,
        amount
      }
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update payment'
    });
  }
});

// Delete a payment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM payments WHERE payment_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete payment'
    });
  }
});

// Get payments by order
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY payment_date DESC',
      [orderId]
    );
    
    res.status(200).json({
      status: 'success',
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments by order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payments'
    });
  }
});

export default router;