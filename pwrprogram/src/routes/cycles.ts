import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { Cycle } from "../entity/cycle"
import { get_user_from_request } from '../session-store'
import { UnauthorizedException } from '../errors/unauthorizederror'
import { removeFieldsMiddleware } from '../../middleware/removeFields';
import Blocks from './blocks';

const router = Express.Router({ mergeParams: true });

// Get program ID from request parameters
router.use(function (req, res, next) {
    try {
        req.program_id = req.params.programId;
        next();
    } catch (err) {
        if (err instanceof UnauthorizedException) {
            res.status(err.code).json({ message: "Missing program ID." });
        } else {
            throw err;
        }
    }
});

export default router

const cycleRepo = AppDataSource.getRepository(Cycle);

router.get('/:id',
    async (req, res) => {
        const cycle = await cycleRepo.findOne({
            where: { id: req.params.id, userId: req.user_id, programId: req.program_id }
        });
        if (!cycle) {
            res.status(404).send(null);
            return;
        }
        res.status(200).json(cycle);
    });


router.get('/', async (req, res) => {
    const cycleList = await cycleRepo.find({
        where: { userId: req.user_id, programId: req.program_id }
    });
    const cleanedList = cycleList.map(({ id, userId, programId, ...rest }) => rest);

    res.status(200).json(cleanedList);
});

router.post('/', async (req, res) => {
    let cycle = new Cycle();
    cycle.name = req.body.name;
    cycle.description = req.body.description;
    cycle.userId = req.user_id;
    cycle.programId = req.program_id;
    cycle.goals = req.body.goals || [];
    cycle.completed = req.body.completed || false; // Default to false if not provided

    // Get the user's most recent cycle
    let mostRecentCycle = await cycleRepo.findOne({
        where: { userId: req.user_id },
        order: { id: "DESC" }
    });

    if (mostRecentCycle) {
        cycle.id = mostRecentCycle.id + 1; // Increment id based on the last cycle
    } else {
        cycle.id = 1; // First cycle for the user
    }

    await cycleRepo.save(cycle);
    res.status(201).json(cycle);
});

router.patch('/:id',
    removeFieldsMiddleware(['userId', 'programId']),
    async (req, res) => {
        const cycle = await cycleRepo.findOne({
            where: { id: req.params.id, userId: req.user_id, programId: req.program_id }
        });
        if (!cycle) {
            res.status(404).send(null);
            return;
        }

        // Update fields
        cycle.name = req.body.name || cycle.name;
        cycle.description = req.body.description || cycle.description;
        cycle.completed = req.body.completed || cycle.completed;
        cycle.goals = req.body.goals || cycle.goals;

        await cycleRepo.save(cycle);
        res.status(200).json(cycle);
    });

router.use('/:cycleId/blocks', Blocks);