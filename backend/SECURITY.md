# YVO Backend Security Documentation

This document outlines the security measures implemented in the YVO backend to ensure data integrity, tenant isolation, and protection against common web vulnerabilities.

## 1. Authentication & Session Management
- **Hashing**: Passwords are hashed using **Argon2id** with high memory and time costs.
- **JWT System**: 
    - Short-lived **Access Tokens** (15 minutes).
    - Long-lived **Refresh Tokens** (30 days).
    - Refresh tokens are **hashed (SHA-256)** before storage in the database.
    - **Rotation**: Refresh tokens rotate upon use to prevent replay attacks.
- **Cookie Security**: Tokens are sent via **httpOnly, Secure, and SameSite=Strict** cookies.

## 2. Multi-Tenant Isolation
- **Strict Filtering**: Every database query is strictly filtered by `companyId` at the controller level.
- **Middleware Enforcement**: A `tenantIsolation` middleware ensures `companyId` is present in the request context for all sensitive routes.
- **RBAC**: Role-based access control (SUPER_ADMIN, OWNER, ADMIN, etc.) is enforced via `authorize` middleware.

## 3. Data Protection
- **Encryption**: Sensitive fields (API keys, backup metadata) are encrypted at rest using **AES-256-GCM**.
- **Input Validation**: All API inputs (body, query, params) are validated and sanitized using **Zod** schemas.
- **Parameterized Queries**: All database interactions use Prisma or parameterized raw SQL to prevent **SQL Injection**.

## 4. API Security Layers
- **Helmet**: Secure HTTP headers (HSTS, CSP, X-Frame-Options).
- **Rate Limiting**: 
    - Global limiter: 100 requests per 15 minutes.
    - Auth limiter: 10 failed login attempts per hour.
- **CORS**: Origin strictly restricted via an allow-list in `.env`.
- **Error Handling**: Internal errors are masked in production to avoid leaking system details.

## 5. Auditing & Monitoring
- **Pino Logger**: Structured logging for security events.
- **Audit Logs**: Comprehensive tracking of sensitive actions (login, backup, data deletion) in the `AuditLog` table.

## Deployment Security Checklist
1. Ensure `NODE_ENV=production`.
2. Generate strong secrets for `JWT_SECRET` and `ENCRYPTION_KEY`.
3. Configure `CORS_ORIGIN` to the production frontend URL.
4. Enable HTTPS/SSL on the hosting provider.
5. Regularly rotate the `ENCRYPTION_KEY` and re-encrypt data if necessary.
