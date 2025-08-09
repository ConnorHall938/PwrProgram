import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

type ClassType<T extends object> = { new(): T };

export const validateRequest = <T extends object>(dtoClass: ClassType<T>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const dtoInstance = plainToInstance(dtoClass, req.body);
        const errors = await validate(dtoInstance);

        if (errors.length > 0) {
            const formattedErrors = formatValidationErrors(errors);
            return res.status(400).json({
                message: 'Validation failed',
                errors: formattedErrors
            });
        }

        req.body = dtoInstance;
        next();
    };
};

function formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
    return errors.reduce((acc, error) => {
        const constraints = error.constraints || {};
        acc[error.property] = Object.values(constraints);
        return acc;
    }, {} as Record<string, string[]>);
}
