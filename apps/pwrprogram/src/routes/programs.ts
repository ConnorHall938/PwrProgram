import { CreateProgramDTO } from '@pwrprogram/shared';
import * as Express from 'express';
import { DataSource } from 'typeorm';

import { Program } from '../entity';
import { toProgramDTO } from '../mappers';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export function programsRouter(dataSource: DataSource): Express.Router {
    const router = Express.Router();
    const progRepo = dataSource.getRepository(Program);

    /**
     * GET /programs
     * Get all programs for the authenticated user with pagination
     */
    router.get('/programs', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const skip = (page - 1) * limit;

        const [programs, total] = await progRepo.findAndCount({
            where: { userId },
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        res.status(200).json({
            data: programs.map(toProgramDTO),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }));

    /**
     * GET /programs/:id
     * Get a specific program (must belong to user)
     */
    router.get('/programs/:id', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId;
        const program = await progRepo.findOne({
            where: { id: req.params.id, userId }
        });

        if (!program) {
            throw new NotFoundError('Program not found');
        }

        res.status(200).json(toProgramDTO(program));
    }));

    /**
     * POST /programs
     * Create a new program
     */
    router.post('/programs', validateRequest(CreateProgramDTO), asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;

        const program = progRepo.create({
            name: req.body.name,
            description: req.body.description,
            userId,
            coachId: req.body.coachId
        });

        await progRepo.save(program);

        logger.info('Program created', { programId: program.id, userId });

        res.status(201).json(toProgramDTO(program));
    }));

    /**
     * DELETE /programs/:id
     * Soft delete a program (must belong to user)
     */
    router.delete('/programs/:id', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId;
        const program = await progRepo.findOne({
            where: { id: req.params.id, userId }
        });

        if (!program) {
            throw new NotFoundError('Program not found');
        }

        await progRepo.softRemove(program);

        logger.info('Program deleted', { programId: program.id, userId });

        res.status(204).send();
    }));

    return router;
}

