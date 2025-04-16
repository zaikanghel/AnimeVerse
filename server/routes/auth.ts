import { Router, Request, Response } from 'express';
import User from '../models/User';
import { auth, generateToken } from '../middleware/auth';

// Helper function to consistently normalize boolean values
function normalizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  // For other truthy/falsy values
  return Boolean(value);
}

const router = Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      isAdmin: false // Default to regular user
    });

    await user.save();

    // Ensure the isAdmin flag is a proper boolean
    const isAdmin = normalizeBoolean(user.isAdmin);

    // Generate token with normalized isAdmin flag
    const token = generateToken(user._id.toString(), isAdmin);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data without password, with normalized isAdmin
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: isAdmin // Use normalized boolean
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // For debugging purposes
    console.log('LOGIN ATTEMPT - User data from database:', { 
      id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
      isAdminType: typeof user.isAdmin
    });
    
    // Use the normalized boolean helper function (imported from auth.ts)
    const isAdmin = normalizeBoolean(user.isAdmin);

    console.log('LOGIN - Admin status (normalized):', { isAdmin });
    
    const token = generateToken(user._id.toString(), isAdmin);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data with consistently normalized admin status
    // Include the token in the response for frontends that might need it
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: isAdmin,
      token: token // Include token in the response body
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Log the user data from database
  console.log('/me endpoint - User data from database:', {
    id: req.user._id,
    username: req.user.username,
    isAdmin: req.user.isAdmin,
    isAdminType: typeof req.user.isAdmin
  });
  
  // Use the consistent normalizeBoolean helper
  const isAdmin = normalizeBoolean(req.user.isAdmin);
  
  console.log('/me endpoint - Admin status (normalized):', { isAdmin });
  
  // Ensure isAdmin is sent as a proper boolean
  const userData = {
    ...req.user.toJSON(),
    isAdmin: isAdmin
  };
  
  res.json(userData);
});

export default router;