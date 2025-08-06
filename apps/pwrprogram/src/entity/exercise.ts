import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm"
import { Session } from "./session"
import { Set } from "./set"

@Entity()
export class Exercise {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    sessionId: string

    @Column()
    name: string

    @Column({ nullable: true })
    description?: string

    @Column({ default: false })
    completed: boolean

    @Column({ nullable: true })
    tutorial_url?: string

    @ManyToOne(() => Session, (session) => session.exercises)
    @JoinColumn({ name: 'sessionId' })  // explicitly link FK column
    session: Session

    @OneToMany(() => Set, (set) => set.exercise)
    sets: Set[];
}