import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany } from "typeorm"
import { Session } from "./session"
import { Set } from "./set"

@Entity()
export class Exercise {
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

    @Column()
    name: string

    @Column({ nullable: true })
    description: string

    @Column({ nullable: true })
    tutorial_url: string

    @ManyToOne(() => Session, (session) => session.exercises)
    session: Session

    @OneToMany(() => Set, (set) => set.exercise)
    sets: Set
}