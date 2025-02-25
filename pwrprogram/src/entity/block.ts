import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany } from "typeorm"
import { Cycle } from "./cycle"
import { Session } from "./session"

@Entity()
export class Block {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    userId: number

    @PrimaryColumn()
    programId: number

    @PrimaryColumn()
    cycleId: number

    @Column()
    name: string

    @Column({ nullable: true })
    description: string

    @Column("text", { array: true, nullable: true })
    goals: string[]

    @ManyToOne(() => Cycle, (cycle) => cycle.blocks)
    cycle: Cycle

    @OneToMany(() => Session, (session) => session.block)
    sessions: Session
}