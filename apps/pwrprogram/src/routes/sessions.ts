import { CreateSessionDTO, UpdateSessionDTO } from '@pwrprogram/shared';
import * as Express from 'express';
import { DataSource } from 'typeorm';

import { Session, Block } from '../entity';
import { toSessionDTO } from '../mappers';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export function sessionsRouter(dataSource: DataSource): Express.Router {
    const router = Express.Router({ mergeParams: true });
    const sessionRepo = dataSource.getRepository(Session);
    const blockRepo = dataSource.getRepository(Block);

    /**
     * Helper to verify block ownership
     */
    async function verifyBlockOwnership(blockId: string, userId: string): Promise<void> {
        const block = await blockRepo.findOne({
            where: { id: blockId },
            relations: ['cycle', 'cycle.program'],
            select: { id: true, cycle: { id: true, program: { id: true, userId: true } } }
        });

        if (!block) {
            throw new NotFoundError('Block not found');
        }

        if (block.cycle.program.userId !== userId) {
            throw new ForbiddenError('You can only access sessions for your own blocks');
        }
    }

    /**
     * GET /blocks/:blockId/sessions
     * List all sessions for a block with pagination
     */
    router.get('/blocks/:blockId/sessions', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const { blockId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const skip = (page - 1) * limit;

        // Verify block ownership
        await verifyBlockOwnership(blockId, userId);

        const [sessions, total] = await sessionRepo.findAndCount({
            where: { blockId },
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        res.status(200).json({
            data: sessions.map(toSessionDTO),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }));

    /**
     * POST /blocks/:blockId/sessions
     * Create a new session
     */
    router.post('/blocks/:blockId/sessions', validateRequest(CreateSessionDTO), asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const { blockId } = req.params;

        // Verify block ownership
        await verifyBlockOwnership(blockId, userId);

        const session = sessionRepo.create({
            blockId,
            name: req.body.name,
            description: req.body.description,
            goals: Array.isArray(req.body.goals) ? req.body.goals : undefined,
            completed: req.body.completed ?? false
        });

        await sessionRepo.save(session);

        logger.info('Session created', { sessionId: session.id, blockId, userId });

        res.status(201).json(toSessionDTO(session));
    }));

    /**
     * GET /sessions/:id
     * Get a specific session
     */
    router.get('/sessions/:id', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const session = await sessionRepo.findOne({
            where: { id: req.params.id },
            relations: ['block', 'block.cycle', 'block.cycle.program']
        });

        if (!session) {
            throw new NotFoundError('Session not found');
        }

        // Verify ownership through block's cycle's program
        if (session.block.cycle.program.userId !== userId) {
            throw new NotFoundError('Session not found');
        }

        res.status(200).json(toSessionDTO(session));
    }));

    /**
     * PATCH /sessions/:id
     * Update a session
     */
    router.patch('/sessions/:id', validateRequest(UpdateSessionDTO), asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const session = await sessionRepo.findOne({
            where: { id: req.params.id },
            relations: ['block', 'block.cycle', 'block.cycle.program']
        });

        if (!session) {
            throw new NotFoundError('Session not found');
        }

        // Verify ownership through block's cycle's program
        if (session.block.cycle.program.userId !== userId) {
            throw new NotFoundError('Session not found');
        }

        // Update fields
        const b = req.body;
        if (b.name !== undefined) session.name = b.name;
        if (b.description !== undefined) session.description = b.description;
        if (b.completed !== undefined) session.completed = b.completed;
        if (Array.isArray(b.goals)) session.goals = b.goals;

        await sessionRepo.save(session);

        logger.info('Session updated', { sessionId: session.id, userId });

        res.status(200).json(toSessionDTO(session));
    }));

    /**
     * DELETE /sessions/:id
     * Soft delete a session
     */
    router.delete('/sessions/:id', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const session = await sessionRepo.findOne({
            where: { id: req.params.id },
            relations: ['block', 'block.cycle', 'block.cycle.program']
        });

        if (!session) {
            throw new NotFoundError('Session not found');
        }

        // Verify ownership through block's cycle's program
        if (session.block.cycle.program.userId !== userId) {
            throw new NotFoundError('Session not found');
        }

        await sessionRepo.softRemove(session);

        logger.info('Session deleted', { sessionId: session.id, userId });

        res.status(204).send();
    }));

    return router;
}
