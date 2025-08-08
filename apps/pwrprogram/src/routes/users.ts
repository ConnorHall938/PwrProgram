import * as Express from 'express';
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { CreateUserDTO } from '@pwrprogram/shared';
import { validateRequest } from '../middleware/validation.middleware';
import { toUserDTO } from '../mappers/user.mapper';

const router = Express.Router();
export default router;

const userRepo = AppDataSource.getRepository(User);

router.get('/:id', async (req, res) => {
  const user = await userRepo.findOneBy({ id: req.params.id });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.status(200).json(toUserDTO(user));
});

router.get('/', async (req, res) => {
  const users = await userRepo.find();
  res.status(200).json(users.map(toUserDTO));
});

router.post('/', validateRequest(CreateUserDTO), async (req, res) => {
  // Create user from DTO
  let user = new User();
  user.email = req.body.email;
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.password = req.body.password;

  userRepo.save(user).then(
    function () {
      res.status(201).json(toUserDTO(user));
    }
  ).catch(error => {
    if (error.code === '23505') {
      res.status(400).json({ message: "Email already exists" });
    } else {
      console.error('Error creating user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
});
