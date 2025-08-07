import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { Program } from "../entity/program"
import { get_user_from_request } from '../session-store'
import { UnauthorizedException } from '../errors/unauthorizederror'
import { Cycle } from '../entity/cycle';
import { plainToInstance } from 'class-transformer';
import { ProgramDTO } from '@pwrprogram/shared';
import { toProgramDTO } from '../mappers/program.mapper';

const router = Express.Router()

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

export default router

const progRepo = AppDataSource.getRepository(Program)

router.get('/:id',
    async (req, res) => {
        const program = await progRepo.findOne({
            where: { id: req.params.id, userId: req.user_id }
        }
        )
        if (!program) {
            res.status(404).send(null);
            return;
        }
        // Convert to DTO
        const dto = toProgramDTO(program);
        res.status(200).json(dto);
    });

router.get('/',
    async (req, res) => {
        const programList = await progRepo.find({
            where: { userId: req.user_id }
        });
        res.status(200).json(programList.map(toProgramDTO));
    });

router.post('/', async (req, res) => {
    let program = new Program();
    program.name = req.body.name;
    program.description = req.body.description;
    program.userId = req.user_id;
    program.coachId = req.body.coachId;

    progRepo.save(program).then(
        function () {
            res.status(201).json(program);
        }
    ).catch(
        error => {
            if (error.code === '23505') {
                res.status(400).json({ message: "Duplicate email entered" })
            }
            else {
                console.log(error);
                res.status(500).json({ message: "Internal server error" });
            }
        }
    )
});


// =============== Cycles Routes ===============

const cycleRepo = AppDataSource.getRepository(Cycle);

router.post('/:programId/cycles', async (req, res) => {
    let cycle = new Cycle();
    cycle.programId = req.params.programId;
    cycle.name = req.body.name;
    cycle.description = req.body.description;
    cycle.goals = Array.isArray(req.body.goals) ? req.body.goals : null;
    cycle.completed = req.body.completed; // Defaults to false if not provided

    await cycleRepo.save(cycle);
    res.status(201).json(cycle);
});

router.get('/:programId/cycles', async (req, res) => {
    const cycleList = await cycleRepo.find({
        where: { programId: req.params.programId }
    });

    res.status(200).json(cycleList);
});