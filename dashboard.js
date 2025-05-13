import express from 'express';
import pool from '../config/database.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Get dashboard statistics
router.get('/', async (req, res) => {
  try {
    // Get total orders
    const [orderCount] = await pool.query('SELECT COUNT(*) as count FROM orders');
    
    // Get total customers
    const [customerCount] = await pool.query('SELECT COUNT(*) as count FROM customers');
    
    // Get total products
    const [productCount] = await pool.query('SELECT COUNT(*) as count FROM products');
    
    // Get total revenue
    const [revenue] = await pool.query('SELECT SUM(amount) as total FROM orders');
    
    // Get low stock products count
    const [lowStockCount] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE stock_quantity < 10'
    );
    
    // Get total employees
    const [employeeCount] = await pool.query('SELECT COUNT(*) as count FROM employee');
    
    // Get total suppliers
    const [supplierCount] = await pool.query('SELECT COUNT(*) as count FROM suppliers');
    
    // Recent orders
    const [recentOrders] = await pool.query(`
      SELECT o.*, c.first_name, c.last_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      ORDER BY o.order_date DESC
      LIMIT 5
    `);
    
    // Monthly revenue data
    const [monthlyRevenue] = await pool.query(`
      SELECT 
        DATE_FORMAT(order_date, '%Y-%m') as month,
        SUM(amount) as total
      FROM orders
      WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
      GROUP BY DATE_FORMAT(order_date, '%Y-%m')
      ORDER BY month
    `);
    
    // Products by category
    const [productsByCategory] = await pool.query(`
      SELECT 
        category,
        COUNT(*) as count
      FROM products
      GROUP BY category
      ORDER BY count DESC
    `);
    
    res.status(200).json({
      status: 'success',
      data: {
        counts: {
          orders: orderCount[0].count,
          customers: customerCount[0].count,
          products: productCount[0].count,
          employees: employeeCount[0].count,
          suppliers: supplierCount[0].count,
          lowStock: lowStockCount[0].count
        },
        revenue: revenue[0].total || 0,
        recentOrders,
        monthlyRevenue,
        productsByCategory
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get sales by customer
router.get('/sales/customers', async (req, res) => {
  try {
    const [sales] = await pool.query(`
      SELECT 
        c.customer_id,
        c.first_name,
        c.last_name,
        COUNT(o.order_id) as order_count,
        SUM(o.amount) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      GROUP BY c.customer_id
      ORDER BY total_spent DESC
    `);
    
    res.status(200).json({
      status: 'success',
      data: sales
    });
  } catch (error) {
    console.error('Error fetching customer sales data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customer sales data'
    });
  }
});

// Get top selling products
router.get('/products/top-selling', async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.category,
        p.price,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * p.price) as total_revenue
      FROM products p
      JOIN order_items oi ON p.product_id = oi.product_id
      GROUP BY p.product_id
      ORDER BY total_quantity DESC
      LIMIT 10
    `);
    
    res.status(200).json({
      status: 'success',
      data: products
    });
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch top selling products'
    });
  }
});

// Get department performance
router.get('/employees/departments', async (req, res) => {
  try {
    const [departments] = await pool.query(`
      SELECT 
        department,
        COUNT(*) as employee_count,
        MIN(salaray) as min_salary,
        MAX(salaray) as max_salary,
        AVG(salaray) as avg_salary,
        SUM(salaray) as total_salary
      FROM employee
      GROUP BY department
      ORDER BY employee_count DESC
    `);
    
    res.status(200).json({
      status: 'success',
      data: departments
    });
  } catch (error) {
    console.error('Error fetching department performance:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch department performance'
    });
  }
});

export default router;