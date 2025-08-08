import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { UnauthorizedException } from '../errors/unauthorizederror'
import { Exercise } from '../entity/exercise';
import { ExerciseDTO, CreateExerciseDTO, UpdateExerciseDTO } from '@pwrprogram/shared';
import { toExerciseDTO } from '../mappers/exercise.mapper';
import { Set } from '../entity/set';
import { SetDTO, CreateSetDTO, UpdateSetDTO } from '@pwrprogram/shared';
import { validateRequest } from '../middleware/validation.middleware';
import { toSetDTO } from '../mappers/set.mapper';

const router = Express.Router({ mergeParams: true });

// Get Session ID from request parameters
router.use(function (req, res, next) {
    try {
        req.session_id = req.params.sessionId;
        next();
    } catch (err) {
        if (err instanceof UnauthorizedException) {
            res.status(err.code).json({ message: "Missing session ID." });
        } else {
            throw err;
        }
    }
});

export default router

const exerciseRepo = AppDataSource.getRepository(Exercise);

router.get('/:id',
    async (req, res) => {
        try {
            const exercise = await exerciseRepo.findOne({
                where: { id: req.params.id, sessionId: req.session_id }
            });
            if (!exercise) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Exercise not found'
                });
            }
            // Convert to DTO
            const dto = toExerciseDTO(exercise);
            res.status(200).json(dto);
        } catch (error) {
            console.error('Error fetching exercise:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch exercise'
            });
        }
    });

router.patch('/:id',
    validateRequest(UpdateExerciseDTO),
    async (req, res) => {
        try {
            const exercise = await exerciseRepo.findOne({
                where: { id: req.params.id, sessionId: req.session_id }
            });
            if (!exercise) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Exercise not found'
                });
            }

            // Update fields using repository merge
            exerciseRepo.merge(exercise, req.body);
            await exerciseRepo.save(exercise);

            // Convert to DTO and send response
            const dto = toExerciseDTO(exercise);
            res.status(200).json(dto);
        } catch (error) {
            console.error('Error updating exercise:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to update exercise'
            });
        }
    });

router.get('/:exerciseId/overview',
    async (req, res) => {
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

            // Get the sets for this exercise
            const sets = await AppDataSource.getRepository(Set).find({
                where: { exerciseId: exercise.id }
            });

            const overview = {
                id: exercise.id,
                name: exercise.name,
                description: exercise.description,
                completed: exercise.completed,
                sets: sets
            };

            res.status(200).json(overview);
        } catch (error) {
            console.error('Error fetching exercise overview:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch exercise overview'
            });
        }
    });

// =============== Sets Routes ===============

const setRepo = AppDataSource.getRepository(Set);

router.post('/:exerciseId/sets',
    validateRequest(CreateSetDTO),
    async (req, res) => {
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

            let set = new Set();
            setRepo.merge(set, req.body);
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

router.get('/:exerciseId/sets',
    async (req, res) => {
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
