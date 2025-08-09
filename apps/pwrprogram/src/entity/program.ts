import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm"

import { Cycle } from "./cycle"
import { User } from "./User"

@Entity()
export class Program {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    userId: string

    @Column({
        nullable: true
    })
    coachId?: string

    @Column()
    name: string

    @Column({ nullable: true })
    description?: string

    @ManyToOne(() => User, (user) => user.programs)
    @JoinColumn({ name: 'userId' })  // explicitly link FK column
    user: User

    @OneToMany(() => Cycle, (cycle) => cycle.program)
    cycles: Cycle[]
}

