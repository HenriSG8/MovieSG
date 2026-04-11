import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { RatingDto } from './dtos/rating.dto';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  async createOrUpdate(ratingDto: any): Promise<Rating> {
    const { userId, movieId, score, comment } = ratingDto;
    
    // Map DTO to entity fields
    const usuarioId = userId;
    const filmeId = movieId;
    const nota = score;

    let rating = await this.ratingRepository.findOne({ 
      where: { usuarioId, filmeId } 
    });

    if (rating) {
      rating.nota = nota;
      rating.comentario = comment;
      return this.ratingRepository.save(rating);
    } else {
      const newRating = this.ratingRepository.create({
        usuarioId,
        filmeId,
        nota,
        comentario: comment
      });
      return this.ratingRepository.save(newRating);
    }
  }

  async findByUserAndMovie(userId: number, movieId: number): Promise<Rating> {
    const rating = await this.ratingRepository.findOne({ 
      where: { usuarioId: userId, filmeId: movieId } 
    });
    
    if (!rating) {
        return { nota: 0, comentario: '' } as Rating;
    }
    
    return rating;
  }

  async getRatingSummary(movieId: number): Promise<{ average: number, count: number }> {
    const result = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.nota)', 'average')
      .addSelect('COUNT(rating.id)', 'count')
      .where('rating.filme_id = :movieId', { movieId })
      .getRawOne();

    return {
      average: parseFloat(result.average) || 0,
      count: parseInt(result.count) || 0
    };
  }

  async findAllByUser(userId: number): Promise<Rating[]> {
    return this.ratingRepository.find({ 
      where: { usuarioId: userId },
      order: { id: 'DESC' }
    });
  }
}
