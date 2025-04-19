const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Security middlewares
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Connect to MongoDB
connectDB();

// Route files
const auth = require('./routes/authRoutes');
const bookings = require('./routes/bookingRoutes');
const companies = require('./routes/companyRoutes');

// Initialize express app
const app = express();

// Body parser and cookie middleware
app.use(express.json());
app.use(cookieParser());

// Apply security middlewares (must be after express.json())
app.use(helmet());             // Set secure HTTP headers
// app.use(mongoSanitize());         // Sanitize NoSQL queries
// app.use(xss());                  // Sanitize user input (XSS protection)
app.use(hpp());                   // Prevent HTTP param pollution
app.use(cors());                  // Enable CORS

// Rate limiter
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,                 // limit each IP to 100 requests per window
});
app.use(limiter);

// Mount API routes
app.use('/api/v1/auth', auth);
app.use('/api/v1/bookings', bookings);
app.use('/api/v1/companies', companies);

// Set PORT from .env or default to 6000
const PORT = process.env.PORT || 6000;

// Start server
const server = app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Graceful shutdown for unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Unhandled Error: ${err.message}`);
  server.close(() => process.exit(1));
});