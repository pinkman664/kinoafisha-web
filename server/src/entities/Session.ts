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

  @Column({
    name: 'startTime',
    type: 'timestamp',
    precision: 6,
  })
  startTime!: Date;

  @Column({
    name: 'endTime',
    type: 'timestamp',
    precision: 6,
    nullable: true,
  })
  endTime!: Date;

  @Column({ type: 'number', precision: 8, scale: 2, nullable: true })
  price!: number;

  @Column({ name: 'vipMultiplier', type: 'number', precision: 5, scale: 2, nullable: true, default: 1.5 })
  vipMultiplier!: number;

  @OneToMany(() => Ticket, (ticket) => ticket.session, { cascade: true })
  tickets!: Ticket[];
}