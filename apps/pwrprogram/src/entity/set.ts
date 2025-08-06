import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm"
import { Exercise } from "./exercise"

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
    target_reps?: number

    @Column({ nullable: true })
    target_weight?: number

    @Column({ nullable: true })
    target_percentage?: number

    @Column({ nullable: true })
    target_rpe?: number

    @Column({ nullable: true })
    actual_reps?: number

    @Column({ nullable: true })
    actual_weight?: number

    @Column({ nullable: true })
    actual_rpe?: number

    @Column({ nullable: false })
    completed?: boolean

    @Column({ nullable: true })
    rest?: number

    @Column({ nullable: true })
    tempo?: string

    @Column({ nullable: true })
    notes?: string
}