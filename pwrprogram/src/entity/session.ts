import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany } from "typeorm"
import { Block } from "./block"
import { Exercise } from "./exercise"

@Entity()
export class Session {
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

    @Column()
    name: string

    @Column({ nullable: true })
    description: string

    @Column("text", { array: true, nullable: true })
    goals: string

    @ManyToOne(() => Block, (block) => block.sessions)
    block: Block

    @OneToMany(() => Exercise, (exercise) => exercise.session)
    exercises: Exercise
}