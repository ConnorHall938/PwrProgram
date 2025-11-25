import { CreateCycleDTO, UpdateCycleDTO } from '@pwrprogram/shared';
import * as Express from 'express';
import { DataSource } from 'typeorm';

import { Cycle, Program } from '../entity';
import { toCycleDTO } from '../mappers';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export function cyclesRouter(dataSource: DataSource): Express.Router {
    const router = Express.Router({ mergeParams: true });
    const cycleRepo = dataSource.getRepository(Cycle);
    const programRepo = dataSource.getRepository(Program);

    /**
     * Helper to verify program ownership
     */
    async function verifyProgramOwnership(programId: string, userId: string): Promise<void> {
        const program = await programRepo.findOne({
            where: { id: programId },
            select: ['id', 'userId']
        });

        if (!program) {
            throw new NotFoundError('Program not found');
        }

        if (program.userId !== userId) {
            throw new ForbiddenError('You can only access cycles for your own programs');
        }
    }

    /**
     * GET /programs/:programId/cycles
     * List all cycles for a program with pagination
     */
    router.get('/programs/:programId/cycles', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const { programId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const skip = (page - 1) * limit;

        // Verify program ownership
        await verifyProgramOwnership(programId, userId);

        const [cycles, total] = await cycleRepo.findAndCount({
            where: { programId },
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        res.status(200).json({
            data: cycles.map(toCycleDTO),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }));

    /**
     * POST /programs/:programId/cycles
     * Create a new cycle
     */
    router.post('/programs/:programId/cycles', validateRequest(CreateCycleDTO), asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const { programId } = req.params;

        // Verify program ownership
        await verifyProgramOwnership(programId, userId);

        const cycle = cycleRepo.create({
            programId,
            name: req.body.name,
            description: req.body.description,
            goals: Array.isArray(req.body.goals) ? req.body.goals : undefined,
            completed: req.body.completed ?? false
        });

        await cycleRepo.save(cycle);

        logger.info('Cycle created', { cycleId: cycle.id, programId, userId });

        res.status(201).json(toCycleDTO(cycle));
    }));

    /**
     * GET /cycles/:id
     * Get a specific cycle
     */
    router.get('/cycles/:id', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const cycle = await cycleRepo.findOne({
            where: { id: req.params.id },
            relations: ['program']
        });

        if (!cycle) {
            throw new NotFoundError('Cycle not found');
        }

        // Verify ownership through program
        if (cycle.program.userId !== userId) {
            throw new NotFoundError('Cycle not found');
        }

        res.status(200).json(toCycleDTO(cycle));
    }));

    /**
     * PATCH /cycles/:id
     * Update a cycle
     */
    router.patch('/cycles/:id', validateRequest(UpdateCycleDTO), asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const cycle = await cycleRepo.findOne({
            where: { id: req.params.id },
            relations: ['program']
        });

        if (!cycle) {
            throw new NotFoundError('Cycle not found');
        }

        // Verify ownership through program
        if (cycle.program.userId !== userId) {
            throw new NotFoundError('Cycle not found');
        }

        // Update fields
        const b = req.body;
        if (b.name !== undefined) cycle.name = b.name;
        if (b.description !== undefined) cycle.description = b.description;
        if (b.completed !== undefined) cycle.completed = b.completed;
        if (Array.isArray(b.goals)) cycle.goals = b.goals;

        await cycleRepo.save(cycle);

        logger.info('Cycle updated', { cycleId: cycle.id, userId });

        res.status(200).json(toCycleDTO(cycle));
    }));

    /**
     * DELETE /cycles/:id
     * Soft delete a cycle
     */
    router.delete('/cycles/:id', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const cycle = await cycleRepo.findOne({
            where: { id: req.params.id },
            relations: ['program']
        });

        if (!cycle) {
            throw new NotFoundError('Cycle not found');
        }

        // Verify ownership through program
        if (cycle.program.userId !== userId) {
            throw new NotFoundError('Cycle not found');
        }

        await cycleRepo.softRemove(cycle);

        logger.info('Cycle deleted', { cycleId: cycle.id, userId });

        res.status(204).send();
    }));

    return router;
}
