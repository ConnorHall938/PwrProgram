import * as Express from 'express';
import { AppDataSource } from "../data-source"
import { UnauthorizedException } from '../errors/unauthorizederror'
import { Set } from '../entity/set';
import { SetDTO } from '@pwrprogram/shared';
import { toSetDTO } from '../mappers/set.mapper';

const router = Express.Router({ mergeParams: true });

// Get Exercise ID from request parameters
router.use(function (req, res, next) {
    try {
        req.exercise_id = req.params.exerciseId;
        next();
    } catch (err) {
        if (err instanceof UnauthorizedException) {
            res.status(err.code).json({ message: "Missing exercise ID." });
        } else {
            throw err;
        }
    }
});

export default router

const setRepo = AppDataSource.getRepository(Set);

router.get('/:id',
    async (req, res) => {
        const set = await setRepo.findOne({
            where: { id: req.params.id, exerciseId: req.exercise_id }
        });
        if (!set) {
            res.status(404).send(null);
            return;
        }
        // Convert to DTO
        const dto = toSetDTO(set);
        res.status(200).json(dto);
    });

router.patch('/:id',
    async (req, res) => {
        const set = await setRepo.findOne({
            where: { id: req.params.id, exerciseId: req.exercise_id }
        });
        if (!set) {
            res.status(404).send(null);
            return;
        }

        // Update fields
        set.target_reps = req.body.target_reps || set.target_reps;
        set.target_weight = req.body.target_weight || set.target_weight;
        set.target_percentage = req.body.target_percentage || set.target_percentage;
        set.target_rpe = req.body.target_rpe || set.target_rpe;
        set.actual_reps = req.body.actual_reps || set.actual_reps;
        set.actual_weight = req.body.actual_weight || set.actual_weight;
        set.actual_rpe = req.body.actual_rpe || set.actual_rpe;
        set.completed = req.body.completed || set.completed;
        set.tempo = req.body.tempo || set.tempo;
        set.rest = req.body.rest || set.rest;
        set.notes = req.body.notes || set.notes;

        await setRepo.save(set);
        // Convert to DTO
        const dto = toSetDTO(set);
        res.status(200).json(dto);
    });
