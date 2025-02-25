import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany } from "typeorm"
import { Exercise } from "./exercise"

@Entity()
export class Set {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    userId: number

    @PrimaryColumn()
    programId: number

    @PrimaryColumn()
    cycleId: number

    @PrimaryColumn()
    blockId: number

    @PrimaryColumn()
    sessionId: number

    @PrimaryColumn()
    exerciseId: number

    @ManyToOne(() => Exercise, (exercise) => exercise.sets)
    exercise: Exercise

    @Column({ nullable: true })
    target_reps: number

    @Column({ nullable: true })
    target_weight: number

    @Column({ nullable: true })
    target_rpe: number

    @Column({ nullable: true })
    actual_reps: number

    @Column({ nullable: true })
    actual_weight: number

    @Column({ nullable: true })
    actual_rpe: number

    @Column({ nullable: true })
    rest: number

    @Column({ nullable: true })
    tempo: string

    @Column({ nullable: true })
    notes: string
}