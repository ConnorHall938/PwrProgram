
import { CreateCycleDTO, UpdateCycleDTO } from '@pwrprogram/shared';
import * as Express from 'express';

import { Cycle } from '../entity';
import { UnauthorizedException } from '../errors/unauthorizederror';
import { toCycleDTO } from '../mappers';
import { validateRequest } from '../middleware/validation.middleware';

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

    router.patch('/:id', validateRequest(UpdateCycleDTO), async (req, res) => {
        const cycle = await cycleRepo.findOne({
            where: { id: req.params.id }
        });
        if (!cycle) {
            res.status(404).send(null);
            return;
        }

        // Update fields (nullish coalescing so falsy values like '' not auto-retained unless intended)
        const b = req.body;
        cycle.name = b.name ?? cycle.name;
        cycle.description = b.description ?? cycle.description;
        cycle.completed = b.completed ?? cycle.completed;
        cycle.goals = Array.isArray(b.goals) ? b.goals : cycle.goals;

        await cycleRepo.save(cycle);
        // Convert to DTO
        const dto = toCycleDTO(cycle);
        res.status(200).json(dto);
    });

    router.post('/programs/:programId/cycles', validateRequest(CreateCycleDTO), async (req, res) => {
        const body = req.body;
        const cycle = cycleRepo.create({
            programId: req.params.programId,
            name: body.name,
            description: body.description,
            goals: Array.isArray(body.goals) ? body.goals : undefined,
            completed: body.completed
        });
        await cycleRepo.save(cycle);
        const dto = toCycleDTO(cycle);
        res.status(201).json(dto);
    });

    router.get('/programs/:programId/cycles', async (req, res) => {
        const cycleList = await cycleRepo.find({
            where: { programId: req.params.programId }
        });
        // Convert to DTOs
        res.status(200).json(cycleList.map(toCycleDTO));
    });

    return router;
}

