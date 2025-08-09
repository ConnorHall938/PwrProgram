import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm"

import { Block } from "./block"
import { Program } from "./program"

@Entity()
export class Cycle {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    programId: string

    @Column()
    name: string

    @Column({ nullable: true })
    description?: string

    @Column({ default: false })
    completed: boolean

    @Column("text", { array: true, nullable: true })
    goals?: string[]

    @ManyToOne(() => Program, (program) => program.cycles)
    @JoinColumn({ name: 'programId' })  // explicitly link FK column
    program: Program

    @OneToMany(() => Block, (block) => block.cycle)
    blocks: Block[];
}