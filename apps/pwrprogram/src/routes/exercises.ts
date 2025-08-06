import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { UnauthorizedException } from '../errors/unauthorizederror'
import { Exercise } from '../entity/exercise';
import { Set } from '../entity/set';

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
        const exercise = await exerciseRepo.findOne({
            where: { id: req.params.id, sessionId: req.session_id }
        });
        if (!exercise) {
            res.status(404).send(null);
            return;
        }
        res.status(200).json(exercise);
    });

router.patch('/:id',
    async (req, res) => {
        const exercise = await exerciseRepo.findOne({
            where: { id: req.params.id, sessionId: req.session_id }
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
    async (req, res) => {
        const exercise = await exerciseRepo.findOne({
            where: { id: req.params.exerciseId, sessionId: req.session_id }
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

// =============== Sets Routes ===============

const setRepo = AppDataSource.getRepository(Set);

router.post('/:exerciseId/sets',
    async (req, res) => {
        let set = new Set();
        set.exerciseId = req.params.exerciseId;
        set.target_reps = req.body.target_reps;
        set.target_weight = req.body.target_weight;
        set.target_percentage = req.body.target_percentage;
        set.target_rpe = req.body.target_rpe;
        set.actual_reps = req.body.actual_reps;
        set.actual_weight = req.body.actual_weight;
        set.actual_rpe = req.body.actual_rpe;
        set.completed = req.body.completed || false; // Default to false if not provided
        set.tempo = req.body.tempo || "0:0:0"; // Default to "0:0:0" if not provided
        set.rest = req.body.rest || 0; // Default to 0 if not provided
        set.notes = req.body.notes || ""; // Default to empty string if not provided

        await setRepo.save(set);
        res.status(201).json(set);
    });

router.get('/:exerciseId/sets',
    async (req, res) => {
        const setList = await setRepo.find({
            where: { exerciseId: req.params.exerciseId }
        });
        res.status(200).json(setList);
    });
