import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import errorHandler from './middlewares/error.middleware.js';

const app = express();

// Middleware
app.use(cors({
  origin: trueg,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api', routes);

// Central API health check
app.get('/', (req, res) => {
  res.json({
    message: 'OneCampus Backend API is running',
    version: '1.0.0',
    endpoints: {
      auth:       '/api/auth',
      teacher:    '/api/teacher',
      admin:      '/api/admin',
      academics:  '/api/academics',
      attendance: '/api/attendance',
      deadlines:  '/api/deadlines',
      marks:      '/api/marks',
      assignment: '/api/assignment',
      user:       '/api/user',
    }
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;

