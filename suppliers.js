import express from 'express';
import pool from '../config/database.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const [suppliers] = await pool.query('SELECT * FROM suppliers ORDER BY supplier_name');
    res.status(200).json({
      status: 'success',
      data: suppliers
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch suppliers'
    });
  }
});

// Get supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [suppliers] = await pool.query('SELECT * FROM suppliers WHERE supplier_id = ?', [id]);
    
    if (suppliers.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: suppliers[0]
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch supplier'
    });
  }
});

// Create a new supplier
router.post('/', async (req, res) => {
  try {
    const { supplier_name, contact_name, phone, email } = req.body;
    
    if (!supplier_name || !contact_name || !phone || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO suppliers (supplier_name, contact_name, phone, email) VALUES (?, ?, ?, ?)',
      [supplier_name, contact_name, phone, email]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'Supplier created successfully',
      data: {
        supplier_id: result.insertId,
        supplier_name,
        contact_name,
        phone,
        email
      }
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create supplier'
    });
  }
});

// Update a supplier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_name, contact_name, phone, email } = req.body;
    
    if (!supplier_name || !contact_name || !phone || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }
    
    const [result] = await pool.query(
      'UPDATE suppliers SET supplier_name = ?, contact_name = ?, phone = ?, email = ? WHERE supplier_id = ?',
      [supplier_name, contact_name, phone, email, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Supplier updated successfully',
      data: {
        supplier_id: parseInt(id),
        supplier_name,
        contact_name,
        phone,
        email
      }
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update supplier'
    });
  }
});

// Delete a supplier
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM suppliers WHERE supplier_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete supplier'
    });
  }
});

export default router;