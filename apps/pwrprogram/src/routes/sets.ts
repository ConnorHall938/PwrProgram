
import { CreateSetDTO, UpdateSetDTO } from '@pwrprogram/shared';
import * as Express from 'express';

import { Exercise } from '../entity/exercise';
import { Set } from '../entity/set';
import { UnauthorizedException } from '../errors/unauthorizederror';
import { toSetDTO } from '../mappers/set.mapper';
import { validateRequest } from '../middleware/validation.middleware';

export function setsRouter(dataSource): Express.Router {
    const router = Express.Router({ mergeParams: true });
    const setRepo = dataSource.getRepository(Set);
    const exerciseRepo = dataSource.getRepository(Exercise);

    // Get Exercise ID from request parameters
    router.use(function (req, res, next) {
        try {
            req.exercise_id = req.params.exerciseId;
            next();
        } catch (err) {
            if (err instanceof UnauthorizedException) {
                res.status(err.code).json({ message: "Missing exercise ID." });
            } else {
                throw err;
            }
        }
    });

    router.post('/:exerciseId/sets', validateRequest(CreateSetDTO), async (req, res) => {
        try {
            const exercise = await exerciseRepo.findOne({
                where: { id: req.params.exerciseId, sessionId: req.session_id }
            });

            if (!exercise) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Exercise not found'
                });
            }

            const b = req.body;
            let set = new Set();
            set.targetReps = b.targetReps;
            set.targetWeight = b.targetWeight;
            set.targetRpe = b.targetRpe;
            set.targetPercentage = b.targetPercentage;
            set.actualReps = b.actualReps;
            set.actualWeight = b.actualWeight;
            set.actualRpe = b.actualRpe;
            set.completed = b.completed ?? false;
            set.tempo = b.tempo;
            set.rest = b.rest;
            set.notes = b.notes;
            set.exerciseId = exercise.id;

            await setRepo.save(set);

            const dto = toSetDTO(set);
            res.status(201).json(dto);
        } catch (error) {
            console.error('Error creating set:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to create set'
            });
        }
    });

    router.get('/:exerciseId/sets', async (req, res) => {
        try {
            const setList = await setRepo.find({
                where: { exerciseId: req.params.exerciseId }
            });
            res.status(200).json(setList.map(toSetDTO));
        } catch (error) {
            console.error('Error fetching sets:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch sets'
            });
        }
    });

    router.get('/:id', async (req, res) => {
        const set = await setRepo.findOne({
            where: { id: req.params.id, exerciseId: req.exercise_id }
        });
        if (!set) {
            res.status(404).send(null);
            return;
        }
        // Convert to DTO
        const dto = toSetDTO(set);
        res.status(200).json(dto);
    });

    router.patch('/:id', validateRequest(UpdateSetDTO), async (req, res) => {
        const set = await setRepo.findOne({
            where: { id: req.params.id, exerciseId: req.exercise_id }
        });
        if (!set) {
            res.status(404).send(null);
            return;
        }

        // Update fields using nullish coalescing so 0/false are preserved
        const b = req.body;
        set.targetReps = b.targetReps ?? set.targetReps;
        set.targetWeight = b.targetWeight ?? set.targetWeight;
        set.targetPercentage = b.targetPercentage ?? set.targetPercentage;
        set.targetRpe = b.targetRpe ?? set.targetRpe;
        set.actualReps = b.actualReps ?? set.actualReps;
        set.actualWeight = b.actualWeight ?? set.actualWeight;
        set.actualRpe = b.actualRpe ?? set.actualRpe;
        set.completed = b.completed ?? set.completed;
        set.tempo = b.tempo ?? set.tempo;
        set.rest = b.rest ?? set.rest;
        set.notes = b.notes ?? set.notes;

        await setRepo.save(set);
        // Convert to DTO
        const dto = toSetDTO(set);
        res.status(200).json(dto);
    });

    return router;
}