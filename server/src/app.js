require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const authenticateToken = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public auth routes
app.use('/auth', authRoutes);

// Protected route example — requires valid JWT
app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Access granted.', 
    user: req.user 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error. Please try again later.' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Metro Booking Auth Server running on port ${PORT}`);
  console.log(`📱 Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✓ Set' : '✗ Missing'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
