import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'favoritos' }) // Mapeia para a tabela que você já criou
@Unique(['userId', 'movieId'])
export class SavedMovie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'userId' })
  userId: number;

  @Column({ name: 'movieId' })
  movieId: number;

  @Column({ name: 'movieTitle' })
  movieTitle: string;

  @Column({ name: 'moviePoster', nullable: true })
  moviePoster: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
