import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany } from "typeorm"
import { Program } from "./program"
import { Block } from "./block"

@Entity()
export class Cycle {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    userId: number

    @PrimaryColumn()
    programId: number

    @Column()
    name: string

    @Column({ nullable: true })
    description: string

    @Column("text", { array: true, nullable: true })
    goals: string[]

    @ManyToOne(() => Program, (program) => program.cycles)
    program: Program

    @OneToMany(() => Block, (block) => block.cycle)
    blocks: Block
}