import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";

import { Block } from "./block";
import { Exercise } from "./exercise";

@Entity()
export class Session {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    blockId: string;

    @Column()
    name: string;

    @Column({ default: false })
    completed: boolean;

    @Column({ nullable: true })
    description: string;

    @Column("text", { array: true, nullable: true })
    goals?: string[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    @ManyToOne(() => Block, (block) => block.sessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'blockId' })
    block: Block;

    @OneToMany(() => Exercise, (exercise) => exercise.session, { cascade: true })
    exercises: Exercise[];
}