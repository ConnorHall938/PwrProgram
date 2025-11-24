import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BeforeInsert, BeforeUpdate, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";
import bcrypt from "bcrypt";
import { Program } from "./program";

@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: false })
    firstName: string;

    @Column({ unique: false, nullable: true })
    lastName?: string;

    @Index()
    @Column({ unique: true })
    email: string;

    @Column({ unique: false, nullable: true, select: false })
    password: string;

    @Column({ default: false })
    isEmailVerified: boolean;

    @Column({ nullable: true })
    emailVerificationToken?: string;

    @Column({ nullable: true })
    passwordResetToken?: string;

    @Column({ nullable: true })
    passwordResetExpires?: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    @OneToMany(() => Program, (program) => program.user)
    programs: Program[];

    // Hash password before saving
    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        // Only hash if password is present and has been modified
        if (this.password && !this.password.startsWith('$2b$')) {
            const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
            this.password = await bcrypt.hash(this.password, rounds);
        }
    }

    // Method to verify password
    async verifyPassword(plainPassword: string): Promise<boolean> {
        if (!this.password) {
            return false;
        }
        return bcrypt.compare(plainPassword, this.password);
    }

    // Method to prepare user for email verification (placeholder for future)
    generateEmailVerificationToken(): string {
        // TODO: Implement email verification token generation
        // This is a placeholder for future email verification feature
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        this.emailVerificationToken = token;
        return token;
    }

    // Method to generate password reset token (placeholder for future)
    generatePasswordResetToken(): string {
        // TODO: Implement password reset token generation
        // This is a placeholder for future password reset feature
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        this.passwordResetToken = token;
        this.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
        return token;
    }
}
