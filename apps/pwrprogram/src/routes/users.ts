import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { User } from "../entity/User"

const router = Express.Router()
export default router

const userRepo = AppDataSource.getRepository(User)

router.get('/:id', async (req, res) => {
  const user = await userRepo.findOneBy({ id: req.params.id })
  if (!user) {
    res.status(404);
    return;
  }
  res.status(200).json(user)
});

router.get('/', async (req, res) => {
  const userList = await userRepo.find()
  res.status(200).json(userList)
});

router.post('/', async (req, res) => {
  const user = userRepo.create(req.body)
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
  )
});