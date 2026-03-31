import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Session } from './Session';
import { Seat } from './Seat';
import { User } from './User';


@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('increment')
  ticketId!: number;

  @ManyToOne(() => Session, (session) => session.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session!: Session;

  @ManyToOne(() => Seat, (seat) => seat.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seatId' })
  seat!: Seat;

  @ManyToOne(() => User, (user) => user.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'date', nullable: true })
  purchaseTime!: Date; // Время покупки билета

  @Column({ type: 'number', precision: 8, scale: 2, nullable: true })
  price!: number; // Цена билета которую заплатил пользователь
}