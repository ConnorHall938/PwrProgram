import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Exercise } from "./exercise";

@Entity()
export class Set {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    exerciseId: string

    @ManyToOne(() => Exercise, (exercise) => exercise.sets)
    @JoinColumn({ name: 'exerciseId' })  // explicitly link FK column
    exercise: Exercise

    @Column({ nullable: true })
    targetReps?: number

    @Column({ nullable: true })
    targetWeight?: number

    @Column({ nullable: true })
    targetPercentage?: number

    @Column({ nullable: true })
    targetRpe?: number

    @Column({ nullable: true })
    actualReps?: number

    @Column({ nullable: true })
    actualWeight?: number

    @Column({ nullable: true })
    actualRpe?: number

    @Column({ nullable: false, default: false })
    completed?: boolean

    @Column({ nullable: true })
    rest?: number

    @Column({ nullable: true })
    tempo?: string

    @Column({ nullable: true })
    notes?: string
}