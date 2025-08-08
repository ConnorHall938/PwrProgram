import * as Express from 'express';
import { AppDataSource } from "../data-source";
import { Cycle } from "../entity/cycle";
import { CycleDTO } from '@pwrprogram/shared';
import { toCycleDTO } from '../mappers/cycle.mapper';
import { UnauthorizedException } from '../errors/unauthorizederror';
import { Block } from '../entity/block';
import { BlockDTO } from '@pwrprogram/shared';
import { toBlockDTO } from '../mappers/block.mapper';

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
            where: { id: req.params.id, programId: req.program_id }
        });
        if (!cycle) {
            res.status(404).send(null);
            return;
        }
        // Convert to DTO
        const dto = toCycleDTO(cycle);
        res.status(200).json(dto);
    });

router.patch('/:id',
    async (req, res) => {
        const cycle = await cycleRepo.findOne({
            where: { id: req.params.id }
        });
        if (!cycle) {
            res.status(404).send(null);
            return;
        }

        // Update fields
        cycle.name = req.body.name || cycle.name;
        cycle.description = req.body.description || cycle.description;
        cycle.completed = req.body.completed || cycle.completed;
        cycle.goals = Array.isArray(req.body.goals) ? req.body.goals : cycle.goals;

        await cycleRepo.save(cycle);
        // Convert to DTO
        const dto = toCycleDTO(cycle);
        res.status(200).json(dto);
    });

// =============== Blocks Routes ===============

const blockRepo = AppDataSource.getRepository(Block);

router.get('/:cycleId/blocks',
    async (req, res) => {
        const blockList = await blockRepo.find({
            where: { cycleId: req.params.cycleId }
        });
        res.status(200).json(blockList.map(toBlockDTO));
    });

router.post('/:cycleId/blocks',
    async (req, res) => {
        let block = new Block();
        block.name = req.body.name;
        block.description = req.body.description;
        block.sessions_per_week = req.body.sessions_per_week; // Default to 4 if not provided
        block.cycleId = req.params.cycleId;
        block.goals = Array.isArray(req.body.goals) ? req.body.goals : [];

        await blockRepo.save(block);
        const dto = toBlockDTO(block);
        res.status(201).json(dto);
    });