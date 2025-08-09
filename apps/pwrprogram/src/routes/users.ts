
import * as Express from 'express';
import { User } from "../entity/User";
import { CreateUserDTO } from '@pwrprogram/shared';
import { validateRequest } from '../middleware/validation.middleware';
import { toUserDTO } from '../mappers/user.mapper';

export function usersRouter(dataSource): Express.Router {
  const router = Express.Router();
  const userRepo = dataSource.getRepository(User);

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
    // Normalize / sanitize input (do not trim password on purpose)
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : req.body.email;
    const firstName = typeof req.body.firstName === 'string' ? req.body.firstName.trim() : req.body.firstName;
    let lastName = req.body.lastName;
    if (typeof lastName === 'string') {
      lastName = lastName.trim();
      if (lastName.length === 0) lastName = null;
    }

    const user = userRepo.create({
      email,
      firstName,
      lastName,
      password: req.body.password
    });
    try {
      await userRepo.save(user);
      res.status(201).json(toUserDTO(user));
    } catch (error: any) {
      if (error && error.code === '23505') {
        return res.status(400).json({ message: 'Email already exists' });
      }
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return router;
}
