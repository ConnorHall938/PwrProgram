import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { Program } from "../entity/program"
import { get_user_from_request } from '../session-store'
import { UnauthorizedException } from '../errors/unauthorizederror'
import Cycles from './cycles'
import { removeFieldsMiddleware } from '../../middleware/removeFields';

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
    removeFieldsMiddleware(['id', 'coachId']),
    async (req, res) => {
        const user = await progRepo.findOne({
            where: { id: req.params.id, userId: req.user_id }
        }
        )
        if (!user) {
            res.status(404).send(null);
            return;
        }
        res.status(200).json(user)
    });

router.get('/',
    removeFieldsMiddleware(['id', 'coachId']),
    async (req, res) => {
        const programList = await progRepo.find({
            where: { userId: req.user_id }
        });
        res.status(200).json(programList)
    });

router.post('/', async (req, res) => {
    let program = new Program();
    program.name = req.body.name;
    program.description = req.body.description;
    program.userId = req.user_id;
    program.coachId = req.body.coachId;

    // Get the user's most recent program
    let mostRecentProgram = await progRepo.findOne({
        where: { userId: req.user_id },
        order: { id: "DESC" }
    });
    program.id = mostRecentProgram ? mostRecentProgram.id + 1 : 1;

    await progRepo.save(program).then(
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

router.use('/:programId/cycles', Cycles);