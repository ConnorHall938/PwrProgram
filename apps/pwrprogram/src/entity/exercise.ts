import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";

import { Session } from "./session";
import { Set } from "./set";

@Entity()
export class Exercise {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    sessionId: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ default: false })
    completed: boolean;

    @Column({ nullable: true })
    tutorial_url?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    @ManyToOne(() => Session, (session) => session.exercises, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sessionId' })
    session: Session;

    @OneToMany(() => Set, (set) => set.exercise, { cascade: true })
    sets: Set[];
}