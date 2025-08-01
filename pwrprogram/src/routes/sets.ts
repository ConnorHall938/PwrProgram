import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { get_user_from_request } from '../session-store'
import { UnauthorizedException } from '../errors/unauthorizederror'
import { removeFieldsMiddleware } from '../../middleware/removeFields';
import { Set } from '../entity/set';

const router = Express.Router({ mergeParams: true });

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

export default router

const setRepo = AppDataSource.getRepository(Set);

router.post('/',
    removeFieldsMiddleware(['userId', 'exerciseId', 'sessionId', 'blockId', 'cycleId', 'programId']),
    async (req, res) => {
        let set = new Set();
        set.userId = req.user_id;
        set.programId = req.program_id;
        set.cycleId = req.cycle_id;
        set.blockId = req.block_id;
        set.sessionId = req.session_id;
        set.exerciseId = req.exercise_id;
        set.target_reps = req.body.target_reps;
        set.target_weight = req.body.target_weight;
        set.target_percentage = req.body.target_percentage;
        set.target_rpe = req.body.target_rpe;
        set.actual_reps = req.body.actual_reps;
        set.actual_weight = req.body.actual_weight;
        set.actual_rpe = req.body.actual_rpe;
        set.tempo = req.body.tempo || "0:0:0"; // Default to "0:0:0" if not provided
        set.rest = req.body.rest || 0; // Default to 0 if not provided
        set.notes = req.body.notes || ""; // Default to empty string if not provided

        // Get the user's most recent set
        let mostRecentSet = await setRepo.findOne({
            where: { userId: req.user_id, exerciseId: req.exercise_id },
            order: { id: 'DESC' }
        });

        if (mostRecentSet) {
            set.id = mostRecentSet.id + 1; // Increment id based on the last set
        } else {
            set.id = 1; // First set for the user
        }

        await setRepo.save(set);
        res.status(201).json(set);
    });

router.get('/:id',
    removeFieldsMiddleware(['userId', 'exerciseId', 'sessionId', 'blockId', 'cycleId', 'programId']),
    async (req, res) => {
        const set = await setRepo.findOne({
            where: { id: req.params.id, userId: req.user_id, exerciseId: req.exercise_id }
        });
        if (!set) {
            res.status(404).send(null);
            return;
        }
        res.status(200).json(set);
    });

router.get('/',
    removeFieldsMiddleware(['userId', 'exerciseId', 'sessionId', 'blockId', 'cycleId', 'programId']),
    async (req, res) => {
        const setList = await setRepo.find({
            where: { userId: req.user_id, exerciseId: req.exercise_id }
        });
        res.status(200).json(setList);
    });
