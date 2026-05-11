import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import {Movie} from './Movie'

@Entity('ratings')
@Unique(['user', 'movie'])
export class Rating {
    @PrimaryGeneratedColumn('increment')
    ratingId!: number;

    @Column({type: 'int'})
    ratingValue!: number;

    @ManyToOne(() => User, (user) => user.ratings)
    @JoinColumn({name:'userId'})
    user!: User;

    @ManyToOne(() => Movie, (movie) => movie.ratings, { onDelete: 'CASCADE' })
    @JoinColumn({name: 'movieId'})
    movie!: Movie;

}