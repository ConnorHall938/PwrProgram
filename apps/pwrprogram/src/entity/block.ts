import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";

import { Cycle } from "./cycle";
import { Session } from "./session";

@Entity()
export class Block {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    @ManyToOne(() => Cycle, (cycle) => cycle.blocks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cycleId' })
    cycle: Cycle;

    @OneToMany(() => Session, (session) => session.block, { cascade: true })
    sessions: Session[];
}