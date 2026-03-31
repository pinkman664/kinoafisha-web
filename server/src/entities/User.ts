import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Ticket } from './Ticket';
import { Comment } from './Comment';
import { Rating } from './Rating';

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin'
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('increment')
    userId!: number;

    @Column({unique: true })
    login!: string;

    @Column()
    password!: string;

    @Column({unique: true})
    email!: string;

    @CreateDateColumn()
    registrationDate!: Date;

    @Column({type: 'char', length: 1, default: 'N'})
    isAdmin!: string;

    @Column({type: 'blob', nullable: true})
    avatarImage!: Buffer;

    @OneToMany(() => Ticket, (ticket) => ticket.user, {cascade: true})
    tickets!: Ticket[];

    @OneToMany(() => Comment, (comment) => comment.user, { cascade: true })
    comments!: Comment[];

    @OneToMany(() => Rating, (rating) => rating.user, { cascade: true })
    ratings!: Rating[];
}