import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { get_user_from_request } from '../session-store'
import { UnauthorizedException } from '../errors/unauthorizederror'
import { removeFieldsMiddleware } from '../../middleware/removeFields';
import { Block } from '../entity/block';
import Sessions from './sessions';

const router = Express.Router({ mergeParams: true });

// Get Cycle ID from request parameters
router.use(function (req, res, next) {
    try {
        req.cycle_id = req.params.cycleId;
        next();
    } catch (err) {
        if (err instanceof UnauthorizedException) {
            res.status(err.code).json({ message: "Missing cycle ID." });
        } else {
            throw err;
        }
    }
});

export default router

const blockRepo = AppDataSource.getRepository(Block);

router.get('/:id',
    removeFieldsMiddleware(['userId', 'cycleId', 'programId']),
    async (req, res) => {
        const block = await blockRepo.findOne({
            where: { id: req.params.id, userId: req.user_id, cycleId: req.cycle_id }
        });
        if (!block) {
            res.status(404).send(null);
            return;
        }
        res.status(200).json(block);
    });

router.get('/',
    removeFieldsMiddleware(['userId', 'cycleId', 'programId']),
    async (req, res) => {
        const blockList = await blockRepo.find({
            where: { userId: req.user_id, cycleId: req.cycle_id }
        });

        res.status(200).json(blockList);
    });

router.post('/',
    removeFieldsMiddleware(['userId', 'cycleId', 'programId']),
    async (req, res) => {
        let block = new Block();
        block.name = req.body.name;
        block.description = req.body.description;
        block.sessions_per_week = req.body.sessions_per_week || 4; // Default to 4 if not provided
        block.userId = req.user_id;
        block.programId = req.program_id;
        block.cycleId = req.cycle_id;
        block.goals = req.body.goals || [];

        // Get the user's most recent Block
        let mostRecentBlock = await blockRepo.findOne({
            where: { userId: req.user_id },
            order: { id: "DESC" }
        });

        if (mostRecentBlock) {
            block.id = mostRecentBlock.id + 1; // Increment id based on the last block
        } else {
            block.id = 1; // First block for the user
        }

        await blockRepo.save(block);
        res.status(201).json(block);
    });

router.use('/:blockId/sessions', Sessions);