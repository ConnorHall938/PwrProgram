import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm"
import { Block } from "./block"
import { Exercise } from "./exercise"

@Entity()
export class Session {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    blockId: string

    @Column()
    name: string

    @Column({ default: false })
    completed: boolean

    @Column({ nullable: true })
    description: string

    @Column("text", { array: true, nullable: true })
    goals?: string[];

    @ManyToOne(() => Block, (block) => block.sessions)
    @JoinColumn({ name: 'blockId' })  // explicitly link FK column
    block: Block

    @OneToMany(() => Exercise, (exercise) => exercise.session)
    exercises: Exercise[];
}