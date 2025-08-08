import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { UnauthorizedException } from '../errors/unauthorizederror'
import { Session } from '../entity/session';
import { SessionDTO, CreateSessionDTO, UpdateSessionDTO } from '@pwrprogram/shared';
import { toSessionDTO } from '../mappers/session.mapper';
import { Exercise } from '../entity/exercise';
import { ExerciseDTO, CreateExerciseDTO } from '@pwrprogram/shared';
import { validateRequest } from '../middleware/validation.middleware';
import { toExerciseDTO } from '../mappers/exercise.mapper';

const router = Express.Router({ mergeParams: true });

// Get Block ID from request parameters
router.use(function (req, res, next) {
    try {
        req.block_id = req.params.blockId;
        next();
    } catch (err) {
        if (err instanceof UnauthorizedException) {
            res.status(err.code).json({
                status: 'error',
                message: "Missing block ID."
            });
        } else {
            throw err;
        }
    }
});

const sessionRepo = AppDataSource.getRepository(Session);
const exerciseRepo = AppDataSource.getRepository(Exercise);

// Get session by ID
router.get('/:id', async (req, res) => {
    try {
        const session = await sessionRepo.findOne({
            where: { id: req.params.id, blockId: req.block_id }
        });
        if (!session) {
            return res.status(404).json({
                status: 'error',
                message: 'Session not found'
            });
        }
        const dto = toSessionDTO(session);
        res.status(200).json(dto);
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch session'
        });
    }
});

// Update session
router.patch('/:id', validateRequest(UpdateSessionDTO), async (req, res) => {
    try {
        const session = await sessionRepo.findOne({
            where: { id: req.params.id, blockId: req.block_id }
        });
        if (!session) {
            return res.status(404).json({
                status: 'error',
                message: 'Session not found'
            });
        }

        sessionRepo.merge(session, req.body);
        await sessionRepo.save(session);

        const dto = toSessionDTO(session);
        res.status(200).json(dto);
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update session'
        });
    }
});

// Create new exercise in session
router.post('/:sessionId/exercises', validateRequest(CreateExerciseDTO), async (req, res) => {
    try {
        const session = await sessionRepo.findOne({
            where: { id: req.params.sessionId, blockId: req.block_id }
        });

        if (!session) {
            return res.status(404).json({
                status: 'error',
                message: 'Session not found'
            });
        }

        const exercise = new Exercise();
        exerciseRepo.merge(exercise, req.body);
        exercise.sessionId = session.id;

        await exerciseRepo.save(exercise);

        const dto = toExerciseDTO(exercise);
        res.status(201).json(dto);
    } catch (error) {
        console.error('Error creating exercise:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create exercise'
        });
    }
});

// Get session overview with exercises
router.get('/:sessionId/overview', async (req, res) => {
    try {
        const session = await sessionRepo.findOne({
            where: { id: req.params.sessionId, blockId: req.block_id }
        });
        if (!session) {
            return res.status(404).json({
                status: 'error',
                message: 'Session not found'
            });
        }

        const exercises = await exerciseRepo.find({
            where: { sessionId: session.id }
        });

        const overview = {
            id: session.id,
            name: session.name,
            description: session.description,
            completed: session.completed,
            exercises: exercises.map(toExerciseDTO)
        };

        res.status(200).json(overview);
    } catch (error) {
        console.error('Error fetching session overview:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch session overview'
        });
    }
});

export default router;
