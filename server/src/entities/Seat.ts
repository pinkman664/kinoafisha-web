import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Hall } from './Hall';
import { Ticket } from './Ticket';


@Entity('seats')
export class Seat {
  @PrimaryGeneratedColumn('increment')
  seatId!: number;

  @ManyToOne(() => Hall, (hall) => hall.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hallId' })
  hall!: Hall;

  @Column({ type: 'number', precision: 5, scale: 0, nullable: true })
  rowNumber!: number; // Номер ряда

  @Column({ type: 'number', precision: 5, scale: 0, nullable: true })
  seatNumber!: number; // Номер места в ряду

  @Column({ type: 'varchar', length: 50, nullable: true })
  seatType!: string; // 'standard', 'vip' и т.д.


  @OneToMany(() => Ticket, (ticket) => ticket.seat, { cascade: true })
  tickets!: Ticket[];
}