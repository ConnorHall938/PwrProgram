import Router from 'express-promise-router'
import { AppDataSource } from "../data-source"
import { User } from "../entity/User"

const router = Router()
export default router

const userRepo = AppDataSource.getRepository(User)

router.get('/:id', async (req,res) => {
  const user = await userRepo.findOneBy({id: req.params.id})
  res.status(200).json(user)
});

router.get('/', async (req,res) => {
  const userList = await userRepo.find()
  res.status(200).json(userList)
});

router.post('/', async (req,res) => {
  let {firstName, lastName, email, password} = req.body;
  const user = new User()
  user.firstName = firstName
  user.lastName = lastName
  user.email = email
  user.password = password
  await userRepo.save(user)

  res.status(201).json(user)
});