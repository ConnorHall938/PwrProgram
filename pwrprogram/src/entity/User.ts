import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number

    @Column(
        {
            unique: false
        }
    )
    firstName: string

    @Column(
        {
            unique: false,
            nullable: true
            }
    )
    lastName: string

    @Column(
    {
    unique: true
    }
    )
    email: string

    @Column(
        {
            unique: false,
            nullable: true
            }
    )
    password: string

}
