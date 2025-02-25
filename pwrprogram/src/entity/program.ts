import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, ManyToOne, OneToMany } from "typeorm"
import { User } from "./User"
import { Cycle } from "./cycle"

@Entity()
export class Program {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    userId: number

    @Column({
        nullable: true
    })
    coachId?: number

    @Column()
    name: string

    @Column({ nullable: true })
    description: string

    @ManyToOne(() => User, (user) => user.programs)
    user: User

    @OneToMany(() => Cycle, (cycle) => cycle.program)
    cycles: Cycle[]
}