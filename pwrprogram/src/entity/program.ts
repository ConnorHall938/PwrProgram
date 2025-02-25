import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, ManyToOne } from "typeorm"
import { User } from "./User"

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
}