import cors from 'cors';

const ACCEPTED_ORIGINS = [
    'http://localhost:1234',
    'http://localhost:8080',
    'https://movies.com', 
];

export const corsMiddleware = ({acceptedOrigins = ACCEPTED_ORIGINS} = {}) => cors(
    {
        origin: (origin, callback) => {
        
            if (!origin || acceptedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('CORS policy violation: Origin not allowed'));
            }
        }, 
        methods: ['GET', 'POST', 'DELETE', 'PATCH'], // Specify allowed methods
        allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
    }
)