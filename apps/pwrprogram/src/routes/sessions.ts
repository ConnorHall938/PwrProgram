
import * as Express from 'express';
import { UnauthorizedException } from '../errors/unauthorizederror';
import { Session } from '../entity/session';
import { SessionDTO, CreateSessionDTO, UpdateSessionDTO } from '@pwrprogram/shared';
import { toSessionDTO } from '../mappers/session.mapper';
import { Exercise } from '../entity/exercise';
import { ExerciseDTO, CreateExerciseDTO } from '@pwrprogram/shared';
import { validateRequest } from '../middleware/validation.middleware';
import { toExerciseDTO } from '../mappers/exercise.mapper';

export function sessionsRouter(dataSource): Express.Router {
    const router = Express.Router({ mergeParams: true });
    const sessionRepo = dataSource.getRepository(Session);
    const exerciseRepo = dataSource.getRepository(Exercise);

    // Get Block ID from request parameters
    router.use(function (req, res, next) {
        try {
            req.block_id = req.params.blockId;
            next();
        } catch (err) {
            if (err instanceof UnauthorizedException) {
                res.status(err.code).json({
                    status: 'error',
                    message: "Missing block ID."
                });
            } else {
                throw err;
            }
        }
    });

    // Get session by ID
    router.get('/:id', async (req, res) => {
        try {
            const session = await sessionRepo.findOne({
                where: { id: req.params.id, blockId: req.block_id }
            });
            if (!session) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Session not found'
                });
            }
            const dto = toSessionDTO(session);
            res.status(200).json(dto);
        } catch (error) {
            console.error('Error fetching session:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch session'
            });
        }
    });

    // Update session
    router.patch('/:id', validateRequest(UpdateSessionDTO), async (req, res) => {
        try {
            const session = await sessionRepo.findOne({
                where: { id: req.params.id, blockId: req.block_id }
            });
            if (!session) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Session not found'
                });
            }

            sessionRepo.merge(session, req.body);
            await sessionRepo.save(session);

            const dto = toSessionDTO(session);
            res.status(200).json(dto);
        } catch (error) {
            console.error('Error updating session:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to update session'
            });
        }
    });

    router.get('/:blockId/sessions', async (req, res) => {
        const sessionList = await sessionRepo.find({
            where: { blockId: req.params.blockId }
        });
        res.status(200).json(sessionList.map(toSessionDTO));
    });

    router.post('/:blockId/sessions', validateRequest(CreateSessionDTO), async (req, res) => {
        const body = req.body;
        const session = sessionRepo.create({
            name: body.name,
            description: body.description,
            blockId: req.params.blockId,
            completed: body.completed
        });
        await sessionRepo.save(session);
        const dto = toSessionDTO(session);
        res.status(201).json(dto);
    });

    return router;
}


