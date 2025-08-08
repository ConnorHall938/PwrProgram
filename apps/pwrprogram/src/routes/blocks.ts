import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { UnauthorizedException } from '../errors/unauthorizederror'
import { Block } from '../entity/block';
import { BlockDTO, CreateBlockDTO, UpdateBlockDTO } from '@pwrprogram/shared';
import { toBlockDTO } from '../mappers/block.mapper';
import { validateRequest } from '../middleware/validation.middleware';
import { Session } from '../entity/session';
import { SessionDTO } from '@pwrprogram/shared';
import { toSessionDTO } from '../mappers/session.mapper';

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
    async (req, res) => {
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

router.patch('/:id',
    validateRequest(UpdateBlockDTO),
    async (req, res) => {
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

router.get('/:blockId/overview',
    async (req, res) => {
        const block = await blockRepo.findOne({
            where: { id: req.params.blockId, cycleId: req.cycle_id }
        });
        if (!block) {
            res.status(404).send(null);
            return;
        }
        //Get all the sessions for this block
        const sessions = await AppDataSource.getRepository('Session').find({
            where: { blockId: req.params.blockId, userId: req.user_id, cycleId: req.cycle_id, programId: req.program_id }
        });

        //Attach each session's exercises and sets
        for (const session of sessions) {
            const exercises = await AppDataSource.getRepository('Exercise').find({
                where: { sessionId: session.id, userId: req.user_id, cycleId: req.cycle_id, programId: req.program_id }
            });
            session.exercises = exercises;

            for (const exercise of exercises) {
                const sets = await AppDataSource.getRepository('Set').find({
                    where: { exerciseId: exercise.id, sessionId: session.id, userId: req.user_id, cycleId: req.cycle_id, programId: req.program_id }
                });
                exercise.sets = sets;
            }
        }

        const overview = {

            id: block.id,
            name: block.name,
            description: block.description,
            goals: block.goals,
            completed: block.completed,
            sessions_per_week: block.sessions_per_week,
            sessions: sessions
        };

        res.status(200).json(overview);
    });

// =============== Sessions Routes ===============

const sessionRepo = AppDataSource.getRepository(Session);

router.get('/:blockId/sessions',
    async (req, res) => {
        const sessionList = await sessionRepo.find({
            where: { blockId: req.params.blockId }
        });
        res.status(200).json(sessionList.map(toSessionDTO));
    });

router.post('/:blockId/sessions',
    async (req, res) => {
        let session = new Session();
        session.name = req.body.name;
        session.description = req.body.description;
        session.blockId = req.params.blockId;
        session.completed = req.body.completed; // Defaults to false if not provided

        await sessionRepo.save(session);
        const dto = toSessionDTO(session);
        res.status(201).json(dto);
    });