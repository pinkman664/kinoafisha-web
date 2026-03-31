import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Movie } from './Movie';
import { Hall } from './Hall';
import { Ticket } from './Ticket';


@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('increment')
  sessionId!: number;

  @ManyToOne(() => Movie, (movie) => movie.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movieId' })
  movie!: Movie;

  @ManyToOne(() => Hall, (hall) => hall.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hallId' })
  hall!: Hall;

  @Column({ type: 'date' })
  startTime!: Date; // Время начала сеанса

  @Column({ type: 'date', nullable: true })
  endTime!: Date; // Время окончания сеанса

  @Column({ type: 'number', precision: 8, scale: 2, nullable: true })
  price!: number; // Цена билета на этот сеанс

  @OneToMany(() => Ticket, (ticket) => ticket.session, { cascade: true })
  tickets!: Ticket[];
}