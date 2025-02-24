import Router from 'express-promise-router'
import { AppDataSource } from "../data-source"
import { Program } from "../entity/program"
import { get_user_from_request } from '../session-store'
import { UnauthorizedException } from '../errors/unauthorizederror'

const router = Router()

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

router.get('/:id', async (req, res) => {
    const user = await progRepo.findOne({
        where: { id: req.params.id, userId: req.user_id },
        relations: {
            user: true,
        },
    }
    )
    if (!user) {
        res.status(404).send(null);
        return;
    }
    res.status(200).json(user)
});

router.get('/', async (req, res) => {
    //const userList = await userRepo.find()
    //res.status(200).json(userList)
});

router.post('/', async (req, res) => {
    /*     const user = userRepo.create(req.body)
        await userRepo.save(user).then(
            function () {
                res.status(201).json(user);
            }
    
        ).catch(
            error => {
                if (error.code === '23505') {
                    res.status(400).json({ message: "Duplicate email entered" })
                }
            }
        ) */
});