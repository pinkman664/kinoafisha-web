import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Cinema } from './Cinema';
import { Seat } from './Seat';
import { Session } from './Session';


@Entity('halls')
export class Hall {
  @PrimaryGeneratedColumn('increment')
  hallId!: number;

  @ManyToOne(() => Cinema, (cinema) => cinema.halls, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cinemaId' })
  cinema!: Cinema;

  @Column({ type: 'varchar', length: 100, nullable: true })
  hallName!: string;

  @Column({ type: 'number', precision: 5, scale: 0, nullable: true })
  capacity!: number; 

  @OneToMany(() => Seat, (seat) => seat.hall, { cascade: true })
  seats!: Seat[];

  @OneToMany(() => Session, (session) => session.hall, { cascade: true })
  sessions!: Session[];
}