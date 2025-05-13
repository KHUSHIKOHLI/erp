import express from 'express';
import pool from '../config/database.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Get all employees
router.get('/', async (req, res) => {
  try {
    const [employees] = await pool.query('SELECT * FROM employee ORDER BY department, last_name');
    res.status(200).json({
      status: 'success',
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch employees'
    });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [employees] = await pool.query('SELECT * FROM employee WHERE employee_id = ?', [id]);
    
    if (employees.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: employees[0]
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch employee'
    });
  }
});

// Create a new employee
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, department, salaray, hire_data } = req.body;
    
    if (!first_name || !last_name || !department || !salaray) {
      return res.status(400).json({
        status: 'error',
        message: 'First name, last name, department and salary are required'
      });
    }
    
    const hireDate = hire_data || new Date().toISOString().slice(0, 10);
    
    const [result] = await pool.query(
      'INSERT INTO employee (first_name, last_name, department, salaray, hire_data) VALUES (?, ?, ?, ?, ?)',
      [first_name, last_name, department, salaray, hireDate]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'Employee created successfully',
      data: {
        employee_id: result.insertId,
        first_name,
        last_name,
        department,
        salaray,
        hire_data: hireDate
      }
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create employee'
    });
  }
});

// Update an employee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, department, salaray, hire_data } = req.body;
    
    if (!first_name || !last_name || !department || !salaray || !hire_data) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }
    
    const [result] = await pool.query(
      'UPDATE employee SET first_name = ?, last_name = ?, department = ?, salaray = ?, hire_data = ? WHERE employee_id = ?',
      [first_name, last_name, department, salaray, hire_data, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Employee updated successfully',
      data: {
        employee_id: parseInt(id),
        first_name,
        last_name,
        department,
        salaray,
        hire_data
      }
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update employee'
    });
  }
});

// Delete an employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM employee WHERE employee_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete employee'
    });
  }
});

// Get employees by department
router.get('/department/:department', async (req, res) => {
  try {
    const { department } = req.params;
    const [employees] = await pool.query(
      'SELECT * FROM employee WHERE department = ? ORDER BY last_name',
      [department]
    );
    
    res.status(200).json({
      status: 'success',
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees by department:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch employees'
    });
  }
});

// Get departments summary
router.get('/summary/departments', async (req, res) => {
  try {
    const [departments] = await pool.query(`
      SELECT 
        department,
        COUNT(*) as employee_count,
        AVG(salaray) as average_salary,
        SUM(salaray) as total_salary
      FROM employee
      GROUP BY department
      ORDER BY department
    `);
    
    res.status(200).json({
      status: 'success',
      data: departments
    });
  } catch (error) {
    console.error('Error fetching department summary:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch department summary'
    });
  }
});

export default router;