const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Security middlewares
const cors = require('cors');
const helmet = require('helmet');
const sanitize = require('mongo-sanitize');
const { xss } = require('express-xss-sanitizer');
const hpp = require('hpp');

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
app.use(cors());                 
// Apply security middlewares (must be after express.json())
app.use(helmet());             // Set secure HTTP headers
app.use(xss());
app.use(hpp());                   // Prevent HTTP param pollution
app.use((req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
});            

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