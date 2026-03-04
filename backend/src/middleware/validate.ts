import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface ValidationSchema {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}

export const validate = (schema: ValidationSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }
            if (schema.query) {
                req.query = await schema.query.parseAsync(req.query) as any;
            }
            if (schema.params) {
                req.params = await schema.params.parseAsync(req.params) as any;
            }
            next();
        } catch (error: any) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Validation failed',
                    errors: error.errors.map((e: any) => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                });
            }
            next(error);
        }
    };
};
