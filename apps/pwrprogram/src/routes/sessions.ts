import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { UnauthorizedException } from '../errors/unauthorizederror'
import { Session } from '../entity/session';
import { Exercise } from '../entity/exercise';

const router = Express.Router({ mergeParams: true });

// Get Block ID from request parameters
router.use(function (req, res, next) {
    try {
        req.block_id = req.params.blockId;
        next();
    } catch (err) {
        if (err instanceof UnauthorizedException) {
            res.status(err.code).json({ message: "Missing block ID." });
        } else {
            throw err;
        }
    }
});

export default router

const sessionRepo = AppDataSource.getRepository(Session);

router.get('/:id',
    async (req, res) => {
        const session = await sessionRepo.findOne({
            where: { id: req.params.id, blockId: req.block_id }
        });
        if (!session) {
            res.status(404).send(null);
            return;
        }
        res.status(200).json(session);
    });

router.patch('/:id',
    async (req, res) => {
        const session = await sessionRepo.findOne({
            where: { id: req.params.id, blockId: req.block_id }
        });
        if (!session) {
            res.status(404).send(null);
            return;
        }

        // Update fields
        session.name = req.body.name || session.name;
        session.description = req.body.description || session.description;
        session.completed = req.body.completed || session.completed;

        await sessionRepo.save(session);
        res.status(200).json(session);
    });

router.get('/:sessionId/overview',
    async (req, res) => {
        const session = await sessionRepo.findOne({
            where: { id: req.params.sessionId, blockId: req.block_id }
        });
        if (!session) {
            res.status(404).send(null);
            return;
        }

        // Fetch exercises for the session
        const exercises = await AppDataSource.getRepository('Exercise').find({
            where: { sessionId: session.id, userId: req.user_id, blockId: req.block_id }
        });

        // Attach each exercise's sets
        for (const exercise of exercises) {
            const sets = await AppDataSource.getRepository('Set').find({
                where: { exerciseId: exercise.id, sessionId: session.id, userId: req.user_id, blockId: req.block_id }
            });
            exercise.sets = sets;
        }

        // Create overview object
        const overview = {
            id: session.id,
            name: session.name,
            description: session.description,
            completed: session.completed,
            exercises: exercises
        };

        res.status(200).json(overview);
    });

// =============== Exercises Routes ===============

const exerciseRepo = AppDataSource.getRepository(Exercise);

router.get('/:sessionId/exercises',
    async (req, res) => {
        const exerciseList = await exerciseRepo.find({
            where: { sessionId: req.params.sessionId }
        });

        res.status(200).json(exerciseList);
    });

router.post('/:sessionId/exercises',
    async (req, res) => {
        let exercise = new Exercise();
        exercise.name = req.body.name;
        exercise.description = req.body.description;
        exercise.sessionId = req.params.sessionId;
        exercise.completed = req.body.completed; // Defaults to false if not provided

        await exerciseRepo.save(exercise);
        res.status(201).json(exercise);
    });