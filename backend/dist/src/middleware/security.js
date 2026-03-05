import helmet from 'helmet';
import cors from 'cors';
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http://localhost:4000", "http://localhost:5173", "http://localhost:3000"],
        },
    },
    xPoweredBy: false, // Disables x-powered-by header
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
});
export const corsOptions = cors({
    origin: true, // Allow all in dev, or configure strictly in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-company-id'],
    credentials: true,
});
