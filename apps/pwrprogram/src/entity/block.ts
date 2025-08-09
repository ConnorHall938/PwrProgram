import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm";

import { Cycle } from "./cycle";
import { Session } from "./session";

@Entity()
export class Block {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    cycleId: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ default: false })
    completed: boolean;

    @Column("text", { array: true, nullable: true })
    goals?: string[];

    @Column({ nullable: false, default: 4 })
    sessionsPerWeek: number;

    @ManyToOne(() => Cycle, (cycle) => cycle.blocks)
    @JoinColumn({ name: 'cycleId' })  // explicitly link FK column
    cycle: Cycle;

    @OneToMany(() => Session, (session) => session.block)
    sessions: Session[];
}