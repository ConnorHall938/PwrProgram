
import * as Express from 'express';
import { Cycle } from "../entity/cycle";
import { CycleDTO } from '@pwrprogram/shared';
import { toCycleDTO } from '../mappers/cycle.mapper';
import { UnauthorizedException } from '../errors/unauthorizederror';
import { Block } from '../entity/block';
import { BlockDTO } from '@pwrprogram/shared';
import { toBlockDTO } from '../mappers/block.mapper';

export function cyclesRouter(dataSource): Express.Router {
    const router = Express.Router({ mergeParams: true });
    const cycleRepo = dataSource.getRepository(Cycle);

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

    router.get('/:id', async (req, res) => {
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

    router.patch('/:id', async (req, res) => {
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

    router.post('/:programId/cycles', async (req, res) => {
        let cycle = new Cycle();
        cycle.programId = req.params.programId;
        cycle.name = req.body.name;
        cycle.description = req.body.description;
        cycle.goals = Array.isArray(req.body.goals) ? req.body.goals : null;
        cycle.completed = req.body.completed; // Defaults to false if not provided

        await cycleRepo.save(cycle);
        // Convert to DTO
        const dto = toCycleDTO(cycle);
        res.status(201).json(dto);
    });

    router.get('/:programId/cycles', async (req, res) => {
        const cycleList = await cycleRepo.find({
            where: { programId: req.params.programId }
        });
        // Convert to DTOs
        res.status(200).json(cycleList.map(toCycleDTO));
    });

    return router;
}

