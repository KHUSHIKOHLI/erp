import express from 'express';
import pool from '../config/database.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const [invoices] = await pool.query(`
      SELECT i.*, c.first_name, c.last_name, o.order_date
      FROM invoices i
      JOIN customers c ON i.customer_id = c.customer_id
      JOIN orders o ON i.order_id = o.order_id
      ORDER BY i.invoice_date DESC
    `);
    
    res.status(200).json({
      status: 'success',
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch invoices'
    });
  }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [invoices] = await pool.query(`
      SELECT i.*, c.first_name, c.last_name, c.email, c.phone, o.order_date
      FROM invoices i
      JOIN customers c ON i.customer_id = c.customer_id
      JOIN orders o ON i.order_id = o.order_id
      WHERE i.invoice_id = ?
    `, [id]);
    
    if (invoices.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Invoice not found'
      });
    }
    
    // Get order items for the invoice
    const [items] = await pool.query(`
      SELECT oi.*, p.product_name, p.price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [invoices[0].order_id]);
    
    // Get payments for the invoice
    const [payments] = await pool.query(`
      SELECT *
      FROM payments
      WHERE order_id = ?
    `, [invoices[0].order_id]);
    
    res.status(200).json({
      status: 'success',
      data: {
        invoice: invoices[0],
        items,
        payments
      }
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch invoice'
    });
  }
});

// Generate a new invoice
router.post('/', async (req, res) => {
  try {
    const { order_id } = req.body;
    
    if (!order_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID is required'
      });
    }
    
    // Check if order exists and get customer_id and amount
    const [orders] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [order_id]);
    
    if (orders.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    const order = orders[0];
    
    // Check if invoice already exists for this order
    const [existingInvoices] = await pool.query('SELECT * FROM invoices WHERE order_id = ?', [order_id]);
    
    if (existingInvoices.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invoice already exists for this order'
      });
    }
    
    // Create the invoice
    const [result] = await pool.query(
      'INSERT INTO invoices (order_id, customer_id, amount, invoice_date, status) VALUES (?, ?, ?, NOW(), "generated")',
      [order_id, order.customer_id, order.amount]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'Invoice generated successfully',
      data: {
        invoice_id: result.insertId,
        order_id,
        customer_id: order.customer_id,
        amount: order.amount,
        status: 'generated'
      }
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate invoice'
    });
  }
});

// Update invoice status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required'
      });
    }
    
    const validStatuses = ['generated', 'paid', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const [result] = await pool.query(
      'UPDATE invoices SET status = ? WHERE invoice_id = ?',
      [status, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Invoice not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Invoice status updated successfully',
      data: {
        invoice_id: parseInt(id),
        status
      }
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update invoice status'
    });
  }
});

// Delete an invoice
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM invoices WHERE invoice_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Invoice not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete invoice'
    });
  }
});

export default router;