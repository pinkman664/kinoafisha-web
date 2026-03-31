import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Hall } from './Hall';


@Entity('cinemas')
export class Cinema {
  @PrimaryGeneratedColumn('increment')
  cinemaId!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  address!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  contactPhone!: string;

  @OneToMany(() => Hall, (hall) => hall.cinema, { cascade: true })
  halls!: Hall[];
}