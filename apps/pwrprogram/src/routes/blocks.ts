import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { UnauthorizedException } from '../errors/unauthorizederror'
import { Block } from '../entity/block';
import { BlockDTO } from '@pwrprogram/shared';
import { toBlockDTO } from '../mappers/block.mapper';
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
        const block = await blockRepo.findOne({
            where: { id: req.params.id, cycleId: req.cycle_id }
        });
        if (!block) {
            res.status(404).send(null);
            return;
        }
        // Convert to DTO
        const dto = toBlockDTO(block);
        res.status(200).json(dto);
    });

router.patch('/:id',
    async (req, res) => {
        const block = await blockRepo.findOne({
            where: { id: req.params.id, cycleId: req.cycle_id }
        });
        if (!block) {
            res.status(404).send(null);
            return;
        }

        // Update fields
        block.name = req.body.name || block.name;
        block.description = req.body.description || block.description;
        block.completed = req.body.completed || block.completed;
        block.goals = req.body.goals || block.goals;
        block.sessions_per_week = req.body.sessions_per_week || block.sessions_per_week;

        await blockRepo.save(block);
        // Convert to DTO
        const dto = toBlockDTO(block);
        res.status(200).json(dto);
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