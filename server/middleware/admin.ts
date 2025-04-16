import { Request, Response, NextFunction } from 'express';

// Helper function to consistently normalize boolean values (same as in auth.ts)
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

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // First check if user is authenticated via session
  if (!req.isAuthenticated()) {
    console.log('Admin middleware - User not authenticated via session');
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // User is authenticated, now check if it exists in the request
  if (!req.user) {
    console.log('Admin middleware - No user found in request despite being authenticated');
    return res.status(401).json({ message: 'User data missing' });
  }
  
  // Log the admin status check
  console.log('Admin middleware - Checking isAdmin for authenticated user:', {
    username: req.user.username,
    isAdmin: req.user.isAdmin,
    isAdminType: typeof req.user.isAdmin
  });
  
  // Create a plain object first for consistent handling
  const user = req.user as any; // Cast to any to bypass TypeScript
  let userData;
  
  try {
    // Convert MongoDB document to plain object if needed
    if (user.toObject) {
      userData = user.toObject();
      console.log('Admin middleware - MongoDB user converted to object, raw isAdmin:', userData.isAdmin);
    } else {
      userData = user;
      console.log('Admin middleware - Memory/plain user, raw isAdmin:', user.isAdmin);
    }
    
    // Normalize the admin status
    const isUserAdmin = normalizeBoolean(userData.isAdmin);
    console.log('Admin middleware - Normalized isAdmin value:', isUserAdmin);
  
    // Check if user has admin privileges
    if (!isUserAdmin) {
      console.log('Admin middleware - Access denied, not an admin');
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    console.log('Admin middleware - Access granted, user is admin');
    return next();
  } catch (error) {
    console.error('Admin middleware - Error processing user:', error);
    return res.status(500).json({ message: 'Server error processing admin access' });
  }
};