import { CreateUserDTO, UpdateUserDTO } from '@pwrprogram/shared';
import * as Express from 'express';
import { DataSource } from 'typeorm';

import { User } from "../entity";
import { toUserDTO } from '../mappers';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler, NotFoundError, ValidationError, ForbiddenError, UnauthorizedError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export function usersRouter(dataSource: DataSource): Express.Router {
  const router = Express.Router();
  const userRepo = dataSource.getRepository(User);

  /**
   * GET /users
   * Get all users with pagination
   */
  router.get('/users', asyncHandler(async (req: Express.Request, res: Express.Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    const [users, total] = await userRepo.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    res.status(200).json({
      data: users.map(toUserDTO),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }));

  /**
   * GET /users/:id
   * Get a specific user
   */
  router.get('/users/:id', asyncHandler(async (req: Express.Request, res: Express.Response) => {
    const user = await userRepo.findOne({
      where: { id: req.params.id },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.status(200).json(toUserDTO(user));
  }));

  /**
   * POST /users
   * Create a new user (admin only - for now anyone can create)
   * Note: Regular users should use /auth/register instead
   */
  router.post('/users', validateRequest(CreateUserDTO), asyncHandler(async (req: Express.Request, res: Express.Response) => {
    const { email, firstName, lastName, password } = req.body;

    const user = userRepo.create({
      email: email.toLowerCase(),
      firstName,
      lastName,
      password, // Will be hashed by @BeforeInsert hook
    });

    await userRepo.save(user);

    logger.info('User created via POST /users', { userId: user.id, email: user.email });

    res.status(201).json(toUserDTO(user));
  }));

  /**
   * PATCH /users/:id
   * Update user profile
   */
  router.patch('/users/:id', validateRequest(UpdateUserDTO), asyncHandler(async (req: Express.Request, res: Express.Response) => {
    const userId = req.params.id;
    const sessionUserId = req.session?.userId;

    // Users can only update their own profile
    if (userId !== sessionUserId) {
      throw new ForbiddenError('You can only update your own profile');
    }

    const user = await userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'firstName', 'lastName', 'password', 'isEmailVerified', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { firstName, lastName, email, currentPassword, newPassword } = req.body;

    // Update basic fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;

    // Email update
    if (email !== undefined && email !== user.email) {
      // Check if new email is already taken
      const existingUser = await userRepo.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        throw new ValidationError('Email already exists');
      }
      user.email = email.toLowerCase();
      user.isEmailVerified = false; // Reset verification status
      // TODO: Send verification email
    }

    // Password update
    if (newPassword) {
      if (!currentPassword) {
        throw new ValidationError('Current password is required to set a new password');
      }

      // Verify current password
      const isPasswordValid = await user.verifyPassword(currentPassword);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      user.password = newPassword; // Will be hashed by @BeforeUpdate hook
      logger.info('User password updated', { userId: user.id });
    }

    await userRepo.save(user);

    logger.info('User profile updated', { userId: user.id });

    res.status(200).json(toUserDTO(user));
  }));

  /**
   * DELETE /users/:id
   * Soft delete a user
   */
  router.delete('/users/:id', asyncHandler(async (req: Express.Request, res: Express.Response) => {
    const userId = req.params.id;
    const sessionUserId = req.session?.userId;

    // Users can only delete their own account
    if (userId !== sessionUserId) {
      throw new ForbiddenError('You can only delete your own account');
    }

    const user = await userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Soft delete
    await userRepo.softRemove(user);

    // Destroy session
    req.session.destroy((err: Error | null) => {
      if (err) {
        logger.error('Error destroying session after user deletion', { error: err, userId });
      }
    });

    logger.info('User deleted', { userId: user.id });

    res.status(204).send();
  }));

  return router;
}
