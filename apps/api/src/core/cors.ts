import cors from 'cors';

const allowedOrigins = [
  'http://localhost:3000', // dev frontend
  'http://localhost:5173', // vite
  'https://yourdomain.com', // production frontend
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

  allowedHeaders: ['Content-Type', 'Authorization'],
});
