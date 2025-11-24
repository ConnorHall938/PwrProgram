import { Entity, Column, PrimaryColumn, Index, DeleteDateColumn } from "typeorm";
import { ISession } from "connect-typeorm";

@Entity('sessions')
export class SessionStore implements ISession {
    @PrimaryColumn("varchar", { length: 255 })
    id: string;

    @Index()
    @Column("bigint", { transformer: { to: (value: number) => value, from: (value: string) => parseInt(value) } })
    expiredAt: number;

    @Column("text")
    json: string;

    @DeleteDateColumn()
    destroyedAt?: Date;
}
