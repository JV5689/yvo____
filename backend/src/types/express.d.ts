import { AuthRequest } from '../middleware/auth';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email?: string;
                companyId?: string;
                role: string;
                isSuperAdmin: boolean;
            };
        }
    }
}
