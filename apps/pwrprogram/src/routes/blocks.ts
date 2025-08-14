
import { CreateBlockDTO, UpdateBlockDTO } from '@pwrprogram/shared';
import * as Express from 'express';

import { Block } from '../entity';
import { UnauthorizedException } from '../errors/unauthorizederror';
import { toBlockDTO } from '../mappers';
import { validateRequest } from '../middleware/validation.middleware';

export function blocksRouter(dataSource): Express.Router {
    const router = Express.Router({ mergeParams: true });
    const blockRepo = dataSource.getRepository(Block);

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

    router.get('/:id', async (req, res) => {
        try {
            const block = await blockRepo.findOne({
                where: { id: req.params.id, cycleId: req.cycle_id }
            });
            if (!block) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Block not found'
                });
            }
            // Convert to DTO
            const dto = toBlockDTO(block);
            res.status(200).json(dto);
        } catch (error) {
            console.error('Error fetching block:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch block'
            });
        }
    });

    router.patch('/:id', validateRequest(UpdateBlockDTO), async (req, res) => {
        try {
            const block = await blockRepo.findOne({
                where: { id: req.params.id, cycleId: req.cycle_id }
            });
            if (!block) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Block not found'
                });
            }

            // Update fields using repository merge
            blockRepo.merge(block, req.body);

            await blockRepo.save(block);
            // Convert to DTO
            const dto = toBlockDTO(block);
            res.status(200).json(dto);
        } catch (error) {
            console.error('Error updating block:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to update block'
            });
        }
    });

    router.get('/cycles/:cycleId/blocks', async (req, res) => {
        const blockList = await blockRepo.find({
            where: { cycleId: req.params.cycleId }
        });
        res.status(200).json(blockList.map(toBlockDTO));
    });

    router.post('/cycles/:cycleId/blocks', validateRequest(CreateBlockDTO), async (req, res) => {
        const body = req.body;
        const block = blockRepo.create({
            name: body.name,
            description: body.description,
            sessionsPerWeek: body.sessionsPerWeek,
            cycleId: req.params.cycleId,
            goals: Array.isArray(body.goals) ? body.goals : []
        });
        await blockRepo.save(block);
        const dto = toBlockDTO(block);
        res.status(201).json(dto);
    });

    return router;
}