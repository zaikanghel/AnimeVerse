# AnimeVerse - Anime Streaming Platform

AnimeVerse is a full-stack web application for streaming anime content with MongoDB integration. The platform features a responsive UI, video playback, content browsing, search functionality, and user management.

## Features

- Responsive UI optimized for all device sizes
- Video streaming functionality for anime episodes
- Content categorization by genres, ratings, and release dates
- Advanced search with MongoDB text indexing
- User authentication and profile management
- Admin dashboard for content management
- Trending anime, recently added episodes, and top-rated sections

## Technology Stack

- **Frontend**: React, TailwindCSS, ShadcnUI components
- **Backend**: Express.js, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **Streaming**: HTML5 video with custom controls

## MongoDB Integration

The application uses MongoDB as the primary database with an in-memory fallback for development or when external MongoDB is unavailable.

### MongoDB Configuration

Set the following environment variables to configure MongoDB:

- `MONGODB_URI`: The connection string to your MongoDB database (default: `mongodb://localhost:27017/animeverse`)
- `MONGODB_USER`: Username for MongoDB authentication
- `MONGODB_PASSWORD`: Password for MongoDB authentication
- `MONGODB_DB_NAME`: Name of the database to use (default: `animeverse`)

### Connection Testing

Use the provided script to test your MongoDB connection:

```bash
# Test MongoDB connection with environment variables
node scripts/test-mongodb-connection.js
```

### Fallback Mechanism

If the connection to an external MongoDB fails, the application will:

1. Automatically fall back to an in-memory MongoDB server
2. Seed the in-memory database with sample data
3. Continue operating normally with the in-memory database

## Project Structure

- `/client` - Frontend React application
- `/server` - Express.js backend API
- `/shared` - Shared types and schema definitions
- `/scripts` - Utility scripts for database management

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Access the application:
   - Frontend: http://localhost:5000
   - API: http://localhost:5000/api

## Database Models

The application uses the following MongoDB models:

- **User**: User authentication and profile information
- **Anime**: Anime metadata and attributes
- **Episode**: Episode information linked to anime
- **Genre**: Content categorization
- **AnimeGenre**: Many-to-many relationship between anime and genres
- **Favorite**: User-saved favorite anime

## API Endpoints

- `/api/animes` - Get all anime titles
- `/api/animes/:id` - Get specific anime details
- `/api/animes/:id/episodes` - Get episodes for an anime
- `/api/episodes/:id` - Get specific episode details
- `/api/genres` - Get all genres
- `/api/genres/:id/animes` - Get animes by genre
- `/api/search?q=query` - Search for anime by title/description
- `/api/trending` - Get trending anime
- `/api/recently-added` - Get recently added episodes
- `/api/top-rated` - Get top-rated anime
- `/api/register` - User registration
- `/api/auth/*` - Authentication endpoints
- `/api/favorites/*` - User favorites management
- `/api/admin/*` - Admin management endpoints

## Admin Features

Admin users can:
- Manage anime content (add, edit, delete)
- Manage episodes (add, edit, delete)
- Manage genres (add, edit, delete)
- Manage user permissions