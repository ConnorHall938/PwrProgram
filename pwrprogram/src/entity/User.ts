import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { Program } from "./program"
@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ unique: false })
    firstName: string;

    @Column({ unique: false, nullable: true })
    lastName: string;

    @Column({ unique: true })
    email: string;

    @Column({ unique: false, nullable: true })
    password: string;

    @OneToMany(() => Program, (program) => program.user)
    programs: Program[];
}
