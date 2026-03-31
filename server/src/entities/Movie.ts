import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { Genre } from './Genre';
import { Session } from './Session';
import { Comment } from './Comment';
import { Rating } from './Rating';


@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('increment')
  movieId!: number;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  description!: string;

  @Column({ type: 'blob', nullable: true })
  coverImage!: Buffer; 

  @Column({ type: 'number', precision: 3, scale: 1, nullable: true })
  rating!: number; // Средний рейтинг (0-10)

  @Column({ type: 'number', precision: 5, scale: 0, nullable: true })
  duration!: number; // Длительность в минутах

  @Column({ type: 'date', nullable: true })
  releaseDate!: Date;

  @Column({ type: 'varchar', length: 10, nullable: true })
  ageRating!: string; // PG, R, 18+ и т.д.

  @Column({ type: 'blob', nullable: true })
  trailer!: Buffer; 

  @ManyToMany(() => Genre, (genre) => genre.movies)
  @JoinTable({
    name: 'moviegenres',
    joinColumn: { name: 'movieId', referencedColumnName: 'movieId' },
    inverseJoinColumn: { name: 'genreId', referencedColumnName: 'genreId' },
  })
  genres!: Genre[];

  @OneToMany(() => Session, (session) => session.movie, { cascade: true })
  sessions!: Session[];

  @OneToMany(() => Comment, (comment) => comment.movie, { cascade: true })
  comments!: Comment[];

  @OneToMany(() => Rating, (rating) => rating.movie, { cascade: true })
  ratings!: Rating[];
}