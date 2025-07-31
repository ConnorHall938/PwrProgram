import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { Cycle } from "../entity/cycle"
import { get_user_from_request } from '../session-store'
import { UnauthorizedException } from '../errors/unauthorizederror'

const router = Express.Router({ mergeParams: true });

// Get program ID from request parameters
router.use(function (req, res, next) {
    try {
        req.program_id = req.params.programId;
        console.log(`Program ID from request: ${req.program_id}`);
        next();
    } catch (err) {
        if (err instanceof UnauthorizedException) {
            res.status(err.code).json({ message: "Missing program ID." });
        } else {
            throw err;
        }
    }
});

// Attach userID from cookie
/* router.use(function (req, res, next) {
    try {
        let user_id = get_user_from_request(req);
        req.user_id = user_id;
        next();
    } catch (err) {
        if (err instanceof UnauthorizedException) {
            res.status(err.code).json({ message: "Unauthorized. Please log in." });
        } else {
            throw err;
        }
    }
}); */

export default router

const cycleRepo = AppDataSource.getRepository(Cycle);

router.get('/:id', async (req, res) => {
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
    console.log(`Fetching cycles for user ID: ${req.user_id} and program ID: ${req.program_id}`);
    const cycleList = await cycleRepo.find({
        where: { userId: req.user_id, programId: req.program_id }
    });
    res.status(200).json(cycleList);
});

router.post('/', async (req, res) => {
    let cycle = new Cycle();
    cycle.name = req.body.name;
    cycle.description = req.body.description;
    cycle.userId = req.user_id;
    cycle.goals = req.body.goals || [];
    // Program ID is provided in the request URL
    cycle.programId = req.program_id;

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