import { storage } from '../server/storage.js';
import bcrypt from 'bcryptjs';

/**
 * Script to create an admin user for initial setup
 * Run with: node scripts/create-admin.js
 */
async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByUsername('admin');
    
    if (existingAdmin) {
      console.log('Admin user already exists.');
      return;
    }
    
    // Hash the password
    const password = 'admin123'; // Default password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the admin user
    const admin = await storage.createUser({
      username: 'admin',
      password: hashedPassword,
      isAdmin: true,
    });
    
    console.log(`Admin user created successfully: ${admin.username} (ID: ${admin.id})`);
    console.log('You can now log in with: username: admin, password: admin123');
    console.log('IMPORTANT: Please change the password after first login for security reasons.');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Execute the function
createAdminUser();