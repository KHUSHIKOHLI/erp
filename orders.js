import express from 'express';
import pool from '../config/database.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Get all orders
router.get('/', async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, 
             c.first_name, c.last_name,
             COUNT(oi.item_id) as item_count
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
    `);
    
    res.status(200).json({
      status: 'success',
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders'
    });
  }
});

// Get order by ID with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get order
    const [orders] = await pool.query(`
      SELECT o.*, c.first_name, c.last_name, c.email, c.phone
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      WHERE o.order_id = ?
    `, [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    // Get order items
    const [items] = await pool.query(`
      SELECT oi.*, p.product_name, p.price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [id]);
    
    // Get payments
    const [payments] = await pool.query(`
      SELECT *
      FROM payments
      WHERE order_id = ?
    `, [id]);
    
    res.status(200).json({
      status: 'success',
      data: {
        order: orders[0],
        items,
        payments
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order'
    });
  }
});

// Create a new order
router.post('/', async (req, res) => {
  let connection;
  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    
    // Start transaction
    await connection.beginTransaction();
    
    const { customer_id, items } = req.body;
    
    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        status: 'error',
        message: 'Customer ID and at least one item are required'
      });
    }
    
    // Check if customer exists
    const [customers] = await connection.query('SELECT * FROM customers WHERE customer_id = ?', [customer_id]);
    
    if (customers.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }
    
    // Create order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_id, order_date, amount, status) VALUES (?, CURDATE(), 0, "Pending")',
      [customer_id]
    );
    
    const orderId = orderResult.insertId;
    let totalAmount = 0;
    
    // Add items to order
    for (const item of items) {
      const { product_id, quantity } = item;
      
      if (!product_id || !quantity) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          status: 'error',
          message: 'Product ID and quantity are required for each item'
        });
      }
      
      // Check if product exists and get price
      const [products] = await connection.query('SELECT * FROM products WHERE product_id = ?', [product_id]);
      
      if (products.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          status: 'error',
          message: `Product with ID ${product_id} not found`
        });
      }
      
      const product = products[0];
      
      // Check if enough stock
      if (product.stock_quantity < quantity) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          status: 'error',
          message: `Not enough stock for product ${product.product_name}, available: ${product.stock_quantity}`
        });
      }
      
      // Add item to order
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)',
        [orderId, product_id, quantity]
      );
      
      // Update product stock
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
        [quantity, product_id]
      );
      
      // Calculate amount
      totalAmount += product.price * quantity;
    }
    
    // Update order amount
    await connection.query(
      'UPDATE orders SET amount = ? WHERE order_id = ?',
      [totalAmount, orderId]
    );
    
    // Commit transaction
    await connection.commit();
    
    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: {
        order_id: orderId,
        customer_id,
        amount: totalAmount,
        items: items.length
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error creating order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create order'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Update order status
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
    
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Canceled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Order status updated successfully',
      data: {
        order_id: parseInt(id),
        status
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order status'
    });
  }
});

// Delete an order (only if it's pending)
router.delete('/:id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Start transaction
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Check if order exists and get status
    const [orders] = await connection.query('SELECT * FROM orders WHERE order_id = ?', [id]);
    
    if (orders.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    const order = orders[0];
    
    // Only allow deleting pending orders
    if (order.status !== 'Pending' && order.status !== "'Pending'") {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        status: 'error',
        message: 'Only pending orders can be deleted'
      });
    }
    
    // Get order items
    const [items] = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    
    // Return stock for each item
    for (const item of items) {
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?',
        [item.quantity, item.product_id]
      );
    }
    
    // Delete order items
    await connection.query('DELETE FROM order_items WHERE order_id = ?', [id]);
    
    // Delete payments
    await connection.query('DELETE FROM payments WHERE order_id = ?', [id]);
    
    // Delete order
    await connection.query('DELETE FROM orders WHERE order_id = ?', [id]);
    
    // Commit transaction
    await connection.commit();
    
    res.status(200).json({
      status: 'success',
      message: 'Order deleted successfully'
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error deleting order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete order'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;