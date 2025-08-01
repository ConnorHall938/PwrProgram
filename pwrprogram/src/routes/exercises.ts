import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { get_user_from_request } from '../session-store'
import { UnauthorizedException } from '../errors/unauthorizederror'
import { removeFieldsMiddleware } from '../../middleware/removeFields';
import { Exercise } from '../entity/exercise';
import Sets from './sets';

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
    removeFieldsMiddleware(['userId', 'sessionId', 'blockId', 'cycleId', 'programId']),
    async (req, res) => {
        const exercise = await exerciseRepo.findOne({
            where: { id: req.params.id, userId: req.user_id, sessionId: req.session_id }
        });
        if (!exercise) {
            res.status(404).send(null);
            return;
        }
        res.status(200).json(exercise);
    });


router.get('/',
    removeFieldsMiddleware(['userId', 'sessionId', 'blockId', 'cycleId', 'programId']),
    async (req, res) => {
        const exerciseList = await exerciseRepo.find({
            where: { userId: req.user_id, sessionId: req.session_id }
        });

        res.status(200).json(exerciseList);
    });

router.post('/',
    removeFieldsMiddleware(['userId', 'sessionId', 'blockId', 'cycleId', 'programId']),
    async (req, res) => {
        let exercise = new Exercise();
        exercise.name = req.body.name;
        exercise.description = req.body.description;
        exercise.userId = req.user_id;
        exercise.sessionId = req.session_id;
        exercise.blockId = req.params.blockId; // Block ID is provided in the request URL
        exercise.cycleId = req.params.cycleId; // Cycle ID is provided in the request URL
        exercise.programId = req.params.programId; // Program ID is provided in the request URL

        // Get the user's most recent exercise
        let mostRecentExercise = await exerciseRepo.findOne({
            where: { userId: req.user_id, sessionId: req.session_id },
            order: { id: 'DESC' }
        });
        if (mostRecentExercise) {
            exercise.id = mostRecentExercise.id + 1; // Increment id based on the last exercise
        } else {
            exercise.id = 1; // First exercise for the user
        }

        await exerciseRepo.save(exercise);
        res.status(201).json(exercise);
    });

router.patch('/:id',
    removeFieldsMiddleware(['userId', 'sessionId', 'blockId', 'cycleId', 'programId']),
    async (req, res) => {
        const exercise = await exerciseRepo.findOne({
            where: { id: req.params.id, userId: req.user_id, sessionId: req.session_id }
        });
        if (!exercise) {
            res.status(404).send(null);
            return;
        }

        // Update fields
        exercise.name = req.body.name || exercise.name;
        exercise.description = req.body.description || exercise.description;
        exercise.completed = req.body.completed || exercise.completed;

        await exerciseRepo.save(exercise);
        res.status(200).json(exercise);
    });

router.get('/:exerciseId/overview',
    removeFieldsMiddleware(['userId', 'sessionId', 'blockId', 'cycleId', 'programId']),
    async (req, res) => {
        const exercise = await exerciseRepo.findOne({
            where: { id: req.params.exerciseId, userId: req.user_id, sessionId: req.session_id }
        });
        if (!exercise) {
            res.status(404).send(null);
            return;
        }

        // Get the sets for this exercise
        const sets = await AppDataSource.getRepository('Set').find({
            where: { exerciseId: exercise.id, userId: req.user_id, sessionId: req.session_id }
        });

        const overview = {
            id: exercise.id,
            name: exercise.name,
            description: exercise.description,
            completed: exercise.completed,
            sets: sets
        };

        res.status(200).json(overview);
    });

router.use('/:exerciseId/sets', Sets);