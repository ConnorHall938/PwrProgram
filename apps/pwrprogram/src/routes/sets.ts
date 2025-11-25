import { CreateSetDTO, UpdateSetDTO } from '@pwrprogram/shared';
import * as Express from 'express';
import { DataSource } from 'typeorm';

import { Exercise, Set } from '../entity';
import { toSetDTO } from '../mappers';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export function setsRouter(dataSource: DataSource): Express.Router {
    const router = Express.Router({ mergeParams: true });
    const setRepo = dataSource.getRepository(Set);
    const exerciseRepo = dataSource.getRepository(Exercise);

    /**
     * Helper to verify exercise ownership
     */
    async function verifyExerciseOwnership(exerciseId: string, userId: string): Promise<void> {
        const exercise = await exerciseRepo.findOne({
            where: { id: exerciseId },
            relations: ['session', 'session.block', 'session.block.cycle', 'session.block.cycle.program'],
            select: {
                id: true,
                session: {
                    id: true,
                    block: {
                        id: true,
                        cycle: {
                            id: true,
                            program: {
                                id: true,
                                userId: true
                            }
                        }
                    }
                }
            }
        });

        if (!exercise) {
            throw new NotFoundError('Exercise not found');
        }

        if (exercise.session.block.cycle.program.userId !== userId) {
            throw new ForbiddenError('You can only access sets for your own exercises');
        }
    }

    /**
     * GET /exercises/:exerciseId/sets
     * List all sets for an exercise with pagination
     */
    router.get('/exercises/:exerciseId/sets', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const { exerciseId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const skip = (page - 1) * limit;

        // Verify exercise ownership
        await verifyExerciseOwnership(exerciseId, userId);

        const [sets, total] = await setRepo.findAndCount({
            where: { exerciseId },
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        res.status(200).json({
            data: sets.map(toSetDTO),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }));

    /**
     * POST /exercises/:exerciseId/sets
     * Create a new set
     */
    router.post('/exercises/:exerciseId/sets', validateRequest(CreateSetDTO), asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const { exerciseId } = req.params;

        // Verify exercise ownership
        await verifyExerciseOwnership(exerciseId, userId);

        const set = setRepo.create({
            exerciseId,
            targetReps: req.body.targetReps,
            targetWeight: req.body.targetWeight,
            targetPercentage: req.body.targetPercentage,
            targetRpe: req.body.targetRpe,
            actualReps: req.body.actualReps,
            actualWeight: req.body.actualWeight,
            actualRpe: req.body.actualRpe,
            completed: req.body.completed ?? false,
            tempo: req.body.tempo,
            rest: req.body.rest,
            notes: req.body.notes
        });

        await setRepo.save(set);

        logger.info('Set created', { setId: set.id, exerciseId, userId });

        res.status(201).json(toSetDTO(set));
    }));

    /**
     * GET /sets/:id
     * Get a specific set
     */
    router.get('/sets/:id', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const set = await setRepo.findOne({
            where: { id: req.params.id },
            relations: ['exercise', 'exercise.session', 'exercise.session.block', 'exercise.session.block.cycle', 'exercise.session.block.cycle.program']
        });

        if (!set) {
            throw new NotFoundError('Set not found');
        }

        // Verify ownership through exercise's session's block's cycle's program
        if (set.exercise.session.block.cycle.program.userId !== userId) {
            throw new NotFoundError('Set not found');
        }

        res.status(200).json(toSetDTO(set));
    }));

    /**
     * PATCH /sets/:id
     * Update a set
     */
    router.patch('/sets/:id', validateRequest(UpdateSetDTO), asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const set = await setRepo.findOne({
            where: { id: req.params.id },
            relations: ['exercise', 'exercise.session', 'exercise.session.block', 'exercise.session.block.cycle', 'exercise.session.block.cycle.program']
        });

        if (!set) {
            throw new NotFoundError('Set not found');
        }

        // Verify ownership through exercise's session's block's cycle's program
        if (set.exercise.session.block.cycle.program.userId !== userId) {
            throw new NotFoundError('Set not found');
        }

        // Update fields
        const b = req.body;
        if (b.targetReps !== undefined) set.targetReps = b.targetReps;
        if (b.targetWeight !== undefined) set.targetWeight = b.targetWeight;
        if (b.targetPercentage !== undefined) set.targetPercentage = b.targetPercentage;
        if (b.targetRpe !== undefined) set.targetRpe = b.targetRpe;
        if (b.actualReps !== undefined) set.actualReps = b.actualReps;
        if (b.actualWeight !== undefined) set.actualWeight = b.actualWeight;
        if (b.actualRpe !== undefined) set.actualRpe = b.actualRpe;
        if (b.completed !== undefined) set.completed = b.completed;
        if (b.tempo !== undefined) set.tempo = b.tempo;
        if (b.rest !== undefined) set.rest = b.rest;
        if (b.notes !== undefined) set.notes = b.notes;

        await setRepo.save(set);

        logger.info('Set updated', { setId: set.id, userId });

        res.status(200).json(toSetDTO(set));
    }));

    /**
     * DELETE /sets/:id
     * Soft delete a set
     */
    router.delete('/sets/:id', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId!;
        const set = await setRepo.findOne({
            where: { id: req.params.id },
            relations: ['exercise', 'exercise.session', 'exercise.session.block', 'exercise.session.block.cycle', 'exercise.session.block.cycle.program']
        });

        if (!set) {
            throw new NotFoundError('Set not found');
        }

        // Verify ownership through exercise's session's block's cycle's program
        if (set.exercise.session.block.cycle.program.userId !== userId) {
            throw new NotFoundError('Set not found');
        }

        await setRepo.softRemove(set);

        logger.info('Set deleted', { setId: set.id, userId });

        res.status(204).send();
    }));

    return router;
}
