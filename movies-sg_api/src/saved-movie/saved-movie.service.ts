import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedMovie } from './entities/saved-movie.entity';

@Injectable()
export class SavedMovieService {
  constructor(
    @InjectRepository(SavedMovie)
    private savedMovieRepository: Repository<SavedMovie>,
  ) {}

  async addSavedMovie(savedData: { userId: number, movieId: number, movieTitle: string, moviePoster?: string }): Promise<SavedMovie> {
    const existing = await this.savedMovieRepository.findOne({
      where: {
        userId: savedData.userId,
        movieId: savedData.movieId,
      },
    });

    if (existing) {
      throw new ConflictException('Este filme já foi salvo na sua lista.');
    }

    const saved = this.savedMovieRepository.create(savedData);
    return await this.savedMovieRepository.save(saved);
  }

  async removeSavedMovie(userId: number, movieId: number): Promise<void> {
    const result = await this.savedMovieRepository.delete({ userId, movieId });
    if (result.affected === 0) {
      throw new NotFoundException('Filme não encontrado na sua lista de salvos.');
    }
  }

  async getSavedMoviesByUser(userId: number): Promise<SavedMovie[]> {
    return await this.savedMovieRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async isSaved(userId: number, movieId: number): Promise<boolean> {
    const count = await this.savedMovieRepository.count({
      where: { userId, movieId },
    });
    return count > 0;
  }
}
