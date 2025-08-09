
import * as Express from 'express';
import { Program } from "../entity/program";
import { get_user_from_request } from '../session-store';
import { UnauthorizedException } from '../errors/unauthorizederror';
import { Cycle } from '../entity/cycle';
import { CycleDTO } from '@pwrprogram/shared';
import { toCycleDTO } from '../mappers/cycle.mapper';
import { plainToInstance } from 'class-transformer';
import { ProgramDTO, CreateProgramDTO, UpdateProgramDTO } from '@pwrprogram/shared';
import { toProgramDTO } from '../mappers/program.mapper';
import { validateRequest } from '../middleware/validation.middleware';

export function programsRouter(dataSource): Express.Router {
    const router = Express.Router();
    const progRepo = dataSource.getRepository(Program);

    //Attach userID from cookie
    router.use(function (req, res, next) {
        try {
            let user_id = get_user_from_request(req);
            req.user_id = user_id;
            next();
        }
        catch (err) {
            if (err instanceof UnauthorizedException) {
                res.status(err.code).json({ message: "Unauthorized. Please log in." });
            }
            else
                throw err;
        }
    });

    router.get('/:id', async (req, res) => {
        const program = await progRepo.findOne({
            where: { id: req.params.id, userId: req.user_id }
        });
        if (!program) {
            res.status(404).send(null);
            return;
        }
        // Convert to DTO
        const dto = toProgramDTO(program);
        res.status(200).json(dto);
    });

    router.get('/', async (req, res) => {
        const programList = await progRepo.find({
            where: { userId: req.user_id }
        });
        res.status(200).json(programList.map(toProgramDTO));
    });

    router.post('/', validateRequest(CreateProgramDTO), async (req, res) => {
        const program = progRepo.create({
            name: req.body.name,
            description: req.body.description,
            userId: req.user_id,
            coachId: req.body.coachId
        });
        try {
            await progRepo.save(program);
            res.status(201).json(toProgramDTO(program));
        } catch (error: any) {
            if (error.code === '23505') {
                return res.status(400).json({ message: "Duplicate email entered" });
            }
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    });

    return router;
}

