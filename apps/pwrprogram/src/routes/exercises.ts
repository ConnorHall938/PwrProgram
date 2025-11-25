import { CreateExerciseDTO, UpdateExerciseDTO } from '@pwrprogram/shared';
import * as Express from 'express';
import { DataSource } from 'typeorm';

import { Exercise, Session } from '../entity';
import { toExerciseDTO } from '../mappers';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export function exercisesRouter(dataSource: DataSource): Express.Router {
    const router = Express.Router({ mergeParams: true });
    const exerciseRepo = dataSource.getRepository(Exercise);
    const sessionRepo = dataSource.getRepository(Session);

    /**
     * Helper to verify session ownership
     */
    async function verifySessionOwnership(sessionId: string, userId: string): Promise<void> {
        const session = await sessionRepo.findOne({
            where: { id: sessionId },
            relations: ['block', 'block.cycle', 'block.cycle.program'],
            select: { id: true, block: { id: true, cycle: { id: true, program: { id: true, userId: true } } } }
        });

        if (!session) {
            throw new NotFoundError('Session not found');
        }

        if (session.block.cycle.program.userId !== userId) {
            throw new ForbiddenError('You can only access exercises for your own sessions');
        }
    }

    /**
     * GET /sessions/:sessionId/exercises
     * List all exercises for a session with pagination
     */
    router.get('/sessions/:sessionId/exercises', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const { sessionId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const skip = (page - 1) * limit;

        // Verify session ownership
        await verifySessionOwnership(sessionId, userId);

        const [exercises, total] = await exerciseRepo.findAndCount({
            where: { sessionId },
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        res.status(200).json({
            data: exercises.map(toExerciseDTO),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }));

    /**
     * POST /sessions/:sessionId/exercises
     * Create a new exercise
     */
    router.post('/sessions/:sessionId/exercises', validateRequest(CreateExerciseDTO), asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const { sessionId } = req.params;

        // Verify session ownership
        await verifySessionOwnership(sessionId, userId);

        const exercise = exerciseRepo.create({
            sessionId,
            name: req.body.name,
            description: req.body.description,
            tutorial_url: req.body.tutorial_url,
            completed: req.body.completed ?? false
        });

        await exerciseRepo.save(exercise);

        logger.info('Exercise created', { exerciseId: exercise.id, sessionId, userId });

        res.status(201).json(toExerciseDTO(exercise));
    }));

    /**
     * GET /exercises/:id
     * Get a specific exercise
     */
    router.get('/exercises/:id', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const exercise = await exerciseRepo.findOne({
            where: { id: req.params.id },
            relations: ['session', 'session.block', 'session.block.cycle', 'session.block.cycle.program']
        });

        if (!exercise) {
            throw new NotFoundError('Exercise not found');
        }

        // Verify ownership through session's block's cycle's program
        if (exercise.session.block.cycle.program.userId !== userId) {
            throw new NotFoundError('Exercise not found');
        }

        res.status(200).json(toExerciseDTO(exercise));
    }));

    /**
     * PATCH /exercises/:id
     * Update an exercise
     */
    router.patch('/exercises/:id', validateRequest(UpdateExerciseDTO), asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const exercise = await exerciseRepo.findOne({
            where: { id: req.params.id },
            relations: ['session', 'session.block', 'session.block.cycle', 'session.block.cycle.program']
        });

        if (!exercise) {
            throw new NotFoundError('Exercise not found');
        }

        // Verify ownership through session's block's cycle's program
        if (exercise.session.block.cycle.program.userId !== userId) {
            throw new NotFoundError('Exercise not found');
        }

        // Update fields
        const b = req.body;
        if (b.name !== undefined) exercise.name = b.name;
        if (b.description !== undefined) exercise.description = b.description;
        if (b.tutorial_url !== undefined) exercise.tutorial_url = b.tutorial_url;
        if (b.completed !== undefined) exercise.completed = b.completed;

        await exerciseRepo.save(exercise);

        logger.info('Exercise updated', { exerciseId: exercise.id, userId });

        res.status(200).json(toExerciseDTO(exercise));
    }));

    /**
     * DELETE /exercises/:id
     * Soft delete an exercise
     */
    router.delete('/exercises/:id', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const exercise = await exerciseRepo.findOne({
            where: { id: req.params.id },
            relations: ['session', 'session.block', 'session.block.cycle', 'session.block.cycle.program']
        });

        if (!exercise) {
            throw new NotFoundError('Exercise not found');
        }

        // Verify ownership through session's block's cycle's program
        if (exercise.session.block.cycle.program.userId !== userId) {
            throw new NotFoundError('Exercise not found');
        }

        await exerciseRepo.softRemove(exercise);

        logger.info('Exercise deleted', { exerciseId: exercise.id, userId });

        res.status(204).send();
    }));

    return router;
}
