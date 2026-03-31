import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
} from 'typeorm';
import { Movie } from './Movie';

@Entity('genres')
export class Genre {
  @PrimaryGeneratedColumn('increment')
  genreId!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nameEn!: string; 

  @Column({ type: 'varchar', length: 50, nullable: true })
  nameRu!: string; 

 
  @ManyToMany(() => Movie, (movie) => movie.genres)
  movies!: Movie[];
}