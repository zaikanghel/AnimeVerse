import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import User from "./models/User";
import { IUser } from "./models/User";
import createMemoryStore from "memorystore";
import { log } from "./vite";
import { storage } from "./storage";
import { isMongoConnected } from "./db";

const MemoryStore = createMemoryStore(session);

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

// Create an admin user if none exists
export async function createAdminUserIfNeeded() {
  try {
    log('Checking for admin user...', 'auth');
    
    if (isMongoConnected) {
      // Try to use MongoDB first if connected
      const existingAdmin = await User.findOne({ username: 'admin' });
      
      if (existingAdmin) {
        log('Admin user already exists in MongoDB.', 'auth');
        return;
      }
      
      log('Creating admin user in MongoDB...', 'auth');
      
      // Create the admin user in MongoDB
      const admin = await User.create({
        username: 'admin',
        email: 'admin@animeverse.com',
        password: 'admin123',
        isAdmin: true,
      });
      
      log(`Admin user created successfully in MongoDB: ${admin.username} (ID: ${admin._id})`, 'auth');
      log('You can log in with: username: admin, password: admin123', 'auth');
    } else {
      // Fallback to in-memory storage if MongoDB is not connected
      const existingAdmin = await storage.getUserByUsername('admin');
      
      if (existingAdmin) {
        log('Admin user already exists in memory storage.', 'auth');
        return;
      }
      
      log('Creating admin user in memory storage...', 'auth');
      
      // Create the admin user in memory
      const admin = await storage.createUser({
        username: 'admin',
        password: 'admin123',
        isAdmin: true,
      });
      
      log(`Admin user created successfully in memory: ${admin.username} (ID: ${admin.id})`, 'auth');
      log('You can log in with: username: admin, password: admin123', 'auth');
    }
  } catch (error) {
    log(`Error creating admin user: ${error}`, 'auth');
    
    // If MongoDB fails, try in-memory as fallback
    if (isMongoConnected) {
      log('Falling back to in-memory storage for admin user creation', 'auth');
      try {
        const existingAdmin = await storage.getUserByUsername('admin');
        
        if (existingAdmin) {
          log('Admin user already exists in memory storage.', 'auth');
          return;
        }
        
        const admin = await storage.createUser({
          username: 'admin',
          password: 'admin123',
          isAdmin: true,
        });
        
        log(`Admin user created successfully in memory: ${admin.username} (ID: ${admin.id})`, 'auth');
        log('You can log in with: username: admin, password: admin123', 'auth');
      } catch (fallbackError) {
        log(`Failed to create admin user in memory: ${fallbackError}`, 'auth');
      }
    }
  }
}

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

export function setupAuth(app: Express) {
  // Use a secure random string as session secret
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  log('Setting up authentication...', 'auth');
  
  // Create admin user if needed
  createAdminUserIfNeeded();
  
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username: string, password: string, done) => {
      try {
        if (isMongoConnected) {
          // Try MongoDB first
          try {
            const user = await User.findOne({ username });
            if (user) {
              // Compare password using the method defined in User model
              const isMatch = await user.comparePassword(password);
              if (isMatch) {
                // Get a plain object representation of the MongoDB user
                // This ensures we're accessing the actual data consistently
                const userData = user.toObject ? user.toObject() : user;
                const normalizedIsAdmin = normalizeBoolean(userData.isAdmin);
                
                // Directly set isAdmin property on the user object
                user.isAdmin = normalizedIsAdmin;
                log(`LocalStrategy - MongoDB user isAdmin original: ${userData.isAdmin}, normalized: ${normalizedIsAdmin}`, 'auth');
                return done(null, user);
              }
            }
          } catch (mongoError) {
            log(`MongoDB authentication error: ${mongoError}`, 'auth');
            // Continue to in-memory fallback
          }
        }
        
        // Fallback to in-memory storage
        try {
          const user = await storage.getUserByUsername(username);
          if (!user) {
            return done(null, false, { message: "Incorrect username or password" });
          }
          
          // For in-memory storage, we compare plain-text passwords
          if (user.password !== password) {
            return done(null, false, { message: "Incorrect username or password" });
          }
          
          // Normalize the isAdmin value before returning
          const normalizedUser = {
            ...user,
            isAdmin: normalizeBoolean(user.isAdmin)
          };
          log(`LocalStrategy - Memory user isAdmin normalized: ${normalizedUser.isAdmin}`, 'auth');
          
          // Cast to any to bypass TS type checking for this case
          return done(null, normalizedUser as any);
        } catch (memError) {
          return done(memError);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user: any, done) => {
    // Handle both MongoDB and in-memory user objects
    const userId = user._id ? user._id : user.id;
    done(null, userId);
  });
  
  passport.deserializeUser(async (id: any, done) => {
    try {
      if (isMongoConnected) {
        try {
          // Try to find user in MongoDB first
          const user = await User.findById(id);
          if (user) {
            // Set the normalized isAdmin value on the user object
            // Use toObject to access a plain object from the Mongoose document
            const userData = user.toObject ? user.toObject() : user;
            const normalizedIsAdmin = normalizeBoolean(userData.isAdmin);
            
            // Directly set isAdmin property on the user object
            user.isAdmin = normalizedIsAdmin;
            log(`deserializeUser - MongoDB user isAdmin original: ${userData.isAdmin}, normalized: ${normalizedIsAdmin}`, 'auth');
            return done(null, user);
          }
        } catch (mongoError) {
          log(`MongoDB deserialize error: ${mongoError}`, 'auth');
          // Continue to fallback
        }
      }
      
      // Fallback to in-memory storage
      try {
        const user = await storage.getUser(parseInt(id));
        if (user) {
          // Normalize the isAdmin value for memory-based users
          const normalizedUser = {
            ...user,
            isAdmin: normalizeBoolean(user.isAdmin)
          };
          // Cast to any to bypass type checking concerns
          return done(null, normalizedUser as any);
        } else {
          return done(new Error('User not found'), null);
        }
      } catch (memError) {
        return done(memError, null);
      }
    } catch (error) {
      done(error, null);
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      let newUser;
      
      // Normalize the isAdmin value from the request
      const isAdminNormalized = normalizeBoolean(req.body.isAdmin);
      log(`Register - Normalized isAdmin value: ${isAdminNormalized}`, 'auth');
      
      if (isMongoConnected) {
        try {
          // Check if user exists in MongoDB
          const existingUser = await User.findOne({ username: req.body.username });
          if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
          }
  
          // Create the user in MongoDB with normalized isAdmin
          newUser = await User.create({
            username: req.body.username,
            email: req.body.email || `${req.body.username}@example.com`,
            password: req.body.password,
            isAdmin: isAdminNormalized, // Use normalized value
          });
          
          log(`User registered in MongoDB: ${newUser.username}`, 'auth');
        } catch (mongoError) {
          log(`MongoDB registration error: ${mongoError}`, 'auth');
          // Fall back to in-memory storage
        }
      }
      
      // If MongoDB failed or is not connected, use in-memory storage
      if (!newUser) {
        // Check if user exists in memory
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }
        
        // Create user in memory storage with normalized isAdmin
        newUser = await storage.createUser({
          username: req.body.username,
          password: req.body.password,
          isAdmin: isAdminNormalized, // Use normalized value
        });
        
        log(`User registered in memory: ${newUser.username}`, 'auth');
      }

      // Login the user
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error during login after registration" });
        }
        
        // Create a plain object first to simplify handling - consistent approach
        let userData;
        if (newUser.toObject) {
          // For MongoDB documents, use toObject() to get a plain object
          userData = newUser.toObject();
          log(`Register - MongoDB user converted to object, isAdmin=${userData.isAdmin}`, 'auth');
        } else {
          // For plain objects, just use as is
          userData = newUser;
          log(`Register - Memory user, isAdmin=${userData.isAdmin}`, 'auth');
        }
        
        // Ensure we remove the password and normalize isAdmin
        const { password, ...userDataWithoutPassword } = userData;
        const userWithoutPassword = {
          ...userDataWithoutPassword,
          isAdmin: normalizeBoolean(userDataWithoutPassword.isAdmin)
        };
        
        log(`Register - Final normalized isAdmin=${userWithoutPassword.isAdmin}`, 'auth');
        
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Error registering user" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      req.login(user, (err: any) => {
        if (err) {
          return next(err);
        }
        
        // Handle MongoDB document or plain object - use consistent approach
        let userData;
        
        // Create a plain object first to simplify handling
        if (user.toObject) {
          // For MongoDB documents, use toObject() to get a plain object
          userData = user.toObject();
          log(`Login - MongoDB user converted to object, isAdmin=${userData.isAdmin}`, 'auth');
        } else {
          // For plain objects, just use as is
          userData = user;
          log(`Login - Memory user, isAdmin=${userData.isAdmin}`, 'auth');
        }
        
        // Ensure we remove the password and normalize isAdmin
        const { password, ...userDataWithoutPassword } = userData;
        const userWithoutPassword = {
          ...userDataWithoutPassword,
          isAdmin: normalizeBoolean(userDataWithoutPassword.isAdmin)
        };
        
        log(`Login - Final normalized isAdmin=${userWithoutPassword.isAdmin}`, 'auth');
        
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Simplify to focus on core issue - properly accessing isAdmin from MongoDB doc
    const user = req.user as any; // Use any to bypass TypeScript checks

    // Create a plain object first to simplify handling
    let userData;
    if (user.toObject) {
      // For MongoDB documents, use toObject() to get a plain object
      userData = user.toObject();
      log(`/me endpoint - MongoDB user converted to object, isAdmin=${userData.isAdmin}`, 'auth');
    } else {
      // For plain objects, just use as is
      userData = user;
      log(`/me endpoint - Memory user, isAdmin=${userData.isAdmin}`, 'auth');
    }
    
    // Ensure we remove the password and normalize isAdmin
    const { password, ...userDataWithoutPassword } = userData;
    const responseData = {
      ...userDataWithoutPassword,
      isAdmin: normalizeBoolean(userDataWithoutPassword.isAdmin)
    };
    
    log(`/me endpoint - Final normalized isAdmin=${responseData.isAdmin}`, 'auth');
    res.json(responseData);
  });
}