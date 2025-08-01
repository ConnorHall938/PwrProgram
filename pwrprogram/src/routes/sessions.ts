import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { get_user_from_request } from '../session-store'
import { UnauthorizedException } from '../errors/unauthorizederror'
import { removeFieldsMiddleware } from '../../middleware/removeFields';
import { Session } from '../entity/session';
import Exercises from './exercises';

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
    removeFieldsMiddleware(['userId', 'blockId', 'cycleId', 'programId']),
    async (req, res) => {
        const session = await sessionRepo.findOne({
            where: { id: req.params.id, userId: req.user_id, blockId: req.block_id }
        });
        if (!session) {
            res.status(404).send(null);
            return;
        }
        res.status(200).json(session);
    });

router.get('/',
    removeFieldsMiddleware(['userId', 'blockId', 'cycleId', 'programId']),
    async (req, res) => {
        const sessionList = await sessionRepo.find({
            where: { userId: req.user_id, blockId: req.block_id }
        });

        res.status(200).json(sessionList);
    });

router.post('/',
    removeFieldsMiddleware(['userId', 'blockId', 'cycleId', 'programId']),
    async (req, res) => {
        let session = new Session();
        session.name = req.body.name;
        session.description = req.body.description;
        session.userId = req.user_id;
        session.blockId = req.block_id;
        session.cycleId = req.cycle_id;
        session.programId = req.program_id;
        session.completed = req.body.completed || false; // Default to false if not provided

        // Get the user's most recent session
        let mostRecentSession = await sessionRepo.findOne({
            where: { userId: req.user_id, blockId: req.block_id, cycleId: req.cycle_id, programId: req.program_id },
            order: { id: "DESC" }
        });

        if (mostRecentSession) {
            session.id = mostRecentSession.id + 1; // Increment id based on the last session
        } else {
            session.id = 1; // First session for the user
        }

        await sessionRepo.save(session);
        res.status(201).json(session);
    });

router.patch('/:id',
    removeFieldsMiddleware(['userId', 'blockId', 'cycleId', 'programId']),
    async (req, res) => {
        const session = await sessionRepo.findOne({
            where: { id: req.params.id, userId: req.user_id, blockId: req.block_id }
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
    removeFieldsMiddleware(['userId', 'blockId', 'cycleId', 'programId', 'exerciseId']),
    async (req, res) => {
        const session = await sessionRepo.findOne({
            where: { id: req.params.sessionId, userId: req.user_id, blockId: req.block_id }
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

router.use('/:sessionId/exercises', Exercises);