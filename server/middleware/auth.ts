import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser; // Define user as IUser interface from User model
      token?: string;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; isAdmin?: boolean };
    console.log('Auth middleware - decoded token:', { userId: decoded.userId, isAdmin: decoded.isAdmin });
    
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      console.log('Auth middleware - User not found for ID:', decoded.userId);
      return res.status(401).json({ message: 'User not found' });
    }

    // Log user details including admin status
    console.log('Auth middleware - User found:', { 
      id: user._id, 
      username: user.username, 
      isAdmin: user.isAdmin,
      isAdminType: typeof user.isAdmin
    });

    // Explicitly normalize admin status from token
    // This ensures admin status is consistent between token and user object
    if (decoded.isAdmin !== undefined) {
      // Convert to proper boolean (handles string 'true'/'false' and actual booleans)
      // This is more secure since the token is signed
      const normalizedIsAdmin = normalizeBoolean(decoded.isAdmin);
      console.log('Auth middleware - Setting normalized isAdmin from token:', normalizedIsAdmin);
      user.isAdmin = normalizedIsAdmin;
    } else {
      // If token doesn't have isAdmin, normalize the user's isAdmin for consistency
      user.isAdmin = normalizeBoolean(user.isAdmin);
      console.log('Auth middleware - Using normalized user isAdmin:', user.isAdmin);
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware - Token verification error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

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

export const generateToken = (userId: string, isAdmin: boolean = false): string => {
  return jwt.sign({ userId, isAdmin }, JWT_SECRET, { expiresIn: '7d' });
};