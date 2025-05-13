import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Username and password are required' 
      });
    }

    // Get user from database
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid username or password' 
      });
    }

    const user = users[0];
    
    // Compare the password
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid username or password' 
      });
    }

    // Create and assign a token
    const token = jwt.sign(
      { id: user.user_id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Set session
    req.session.user = {
      id: user.user_id,
      username: user.username
    };

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Server error during login' 
    });
  }
});

// Register route (for development/admin only)
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Username and password are required' 
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Username already exists' 
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Server error during registration' 
    });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Could not log out' 
      });
    }
    
    res.clearCookie('connect.sid');
    res.status(200).json({ 
      status: 'success', 
      message: 'Logged out successfully' 
    });
  });
});

// Check if user is authenticated
router.get('/check', (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({
      status: 'success',
      authenticated: true,
      user: req.session.user
    });
  }
  
  res.status(200).json({
    status: 'success',
    authenticated: false
  });
});

export default router;