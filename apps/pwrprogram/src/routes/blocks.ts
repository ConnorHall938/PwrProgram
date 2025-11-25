import { CreateBlockDTO, UpdateBlockDTO } from '@pwrprogram/shared';
import * as Express from 'express';
import { DataSource } from 'typeorm';

import { Block, Cycle } from '../entity';
import { toBlockDTO } from '../mappers';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export function blocksRouter(dataSource: DataSource): Express.Router {
    const router = Express.Router({ mergeParams: true });
    const blockRepo = dataSource.getRepository(Block);
    const cycleRepo = dataSource.getRepository(Cycle);

    /**
     * Helper to verify cycle ownership
     */
    async function verifyCycleOwnership(cycleId: string, userId: string): Promise<void> {
        const cycle = await cycleRepo.findOne({
            where: { id: cycleId },
            relations: ['program'],
            select: { id: true, program: { id: true, userId: true } }
        });

        if (!cycle) {
            throw new NotFoundError('Cycle not found');
        }

        if (cycle.program.userId !== userId) {
            throw new ForbiddenError('You can only access blocks for your own cycles');
        }
    }

    /**
     * GET /cycles/:cycleId/blocks
     * List all blocks for a cycle with pagination
     */
    router.get('/cycles/:cycleId/blocks', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const { cycleId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const skip = (page - 1) * limit;

        // Verify cycle ownership
        await verifyCycleOwnership(cycleId, userId);

        const [blocks, total] = await blockRepo.findAndCount({
            where: { cycleId },
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        res.status(200).json({
            data: blocks.map(toBlockDTO),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }));

    /**
     * POST /cycles/:cycleId/blocks
     * Create a new block
     */
    router.post('/cycles/:cycleId/blocks', validateRequest(CreateBlockDTO), asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const { cycleId } = req.params;

        // Verify cycle ownership
        await verifyCycleOwnership(cycleId, userId);

        const block = blockRepo.create({
            cycleId,
            name: req.body.name,
            description: req.body.description,
            sessionsPerWeek: req.body.sessionsPerWeek ?? 4,
            goals: Array.isArray(req.body.goals) ? req.body.goals : undefined,
            completed: req.body.completed ?? false
        });

        await blockRepo.save(block);

        logger.info('Block created', { blockId: block.id, cycleId, userId });

        res.status(201).json(toBlockDTO(block));
    }));

    /**
     * GET /blocks/:id
     * Get a specific block
     */
    router.get('/blocks/:id', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const block = await blockRepo.findOne({
            where: { id: req.params.id },
            relations: ['cycle', 'cycle.program']
        });

        if (!block) {
            throw new NotFoundError('Block not found');
        }

        // Verify ownership through cycle's program
        if (block.cycle.program.userId !== userId) {
            throw new NotFoundError('Block not found');
        }

        res.status(200).json(toBlockDTO(block));
    }));

    /**
     * PATCH /blocks/:id
     * Update a block
     */
    router.patch('/blocks/:id', validateRequest(UpdateBlockDTO), asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const block = await blockRepo.findOne({
            where: { id: req.params.id },
            relations: ['cycle', 'cycle.program']
        });

        if (!block) {
            throw new NotFoundError('Block not found');
        }

        // Verify ownership through cycle's program
        if (block.cycle.program.userId !== userId) {
            throw new NotFoundError('Block not found');
        }

        // Update fields
        const b = req.body;
        if (b.name !== undefined) block.name = b.name;
        if (b.description !== undefined) block.description = b.description;
        if (b.sessionsPerWeek !== undefined) block.sessionsPerWeek = b.sessionsPerWeek;
        if (b.completed !== undefined) block.completed = b.completed;
        if (Array.isArray(b.goals)) block.goals = b.goals;

        await blockRepo.save(block);

        logger.info('Block updated', { blockId: block.id, userId });

        res.status(200).json(toBlockDTO(block));
    }));

    /**
     * DELETE /blocks/:id
     * Soft delete a block
     */
    router.delete('/blocks/:id', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const block = await blockRepo.findOne({
            where: { id: req.params.id },
            relations: ['cycle', 'cycle.program']
        });

        if (!block) {
            throw new NotFoundError('Block not found');
        }

        // Verify ownership through cycle's program
        if (block.cycle.program.userId !== userId) {
            throw new NotFoundError('Block not found');
        }

        await blockRepo.softRemove(block);

        logger.info('Block deleted', { blockId: block.id, userId });

        res.status(204).send();
    }));

    return router;
}
