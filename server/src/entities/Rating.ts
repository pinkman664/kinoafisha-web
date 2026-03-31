import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Unique,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import {Movie} from './Movie'

@Entity('ratings')
@Unique(['userId', 'movieId'])
export class Rating {
    @PrimaryGeneratedColumn('increment')
    ratingId!: number;

    @Column({type: 'number', precision: 2, scale: 1})
    ratingValue!: number;

    @Column({name: 'userId', insert: false, update: false})
    userId!: number;

    @Column({name: 'movieId', insert: false, update: false})
    movieId!: number;

    @ManyToMany(() => User, (user) => user.ratings)
    @JoinColumn({name:'userId'})
    user!: User;

    @ManyToMany(() => Movie, (movie) => movie.ratings)
    @JoinColumn({name: 'movieId'})
    movie!: Movie;

}