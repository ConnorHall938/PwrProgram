import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";

import { Block } from "./block";
import { Program } from "./program";

@Entity()
export class Cycle {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    programId: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ default: false })
    completed: boolean;

    @Column("text", { array: true, nullable: true })
    goals?: string[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    @ManyToOne(() => Program, (program) => program.cycles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'programId' })
    program: Program;

    @OneToMany(() => Block, (block) => block.cycle, { cascade: true })
    blocks: Block[];
}