import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { RatingDto } from './dtos/rating.dto';
import { Friendship, FriendshipStatus } from '../friendship/entities/friendship.entity';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
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

  async getFriendsRecommendations(userId: number): Promise<any[]> {
    // 1. Busca todas as amizades aceitas do user
    const friendships = await this.friendshipRepository.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'addressee'],
    });

    if (friendships.length === 0) return [];

    // 2. Monta a lista de IDs dos amigos
    const friendIds = friendships.map(f =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );

    // 3. Busca notas >= 7 de qualquer um desses amigos
    const ratings = await this.ratingRepository
      .createQueryBuilder('rating')
      .leftJoinAndSelect('rating.user', 'user')
      .where('rating.usuario_id IN (:...friendIds)', { friendIds })
      .andWhere('rating.nota >= :minScore', { minScore: 7 })
      .orderBy('rating.nota', 'DESC')
      .getMany();

    // 4. Remove filmes duplicados (se dois amigos avaliaram o mesmo)
    const seen = new Set<number>();
    const unique = ratings.filter(r => {
      if (seen.has(r.filmeId)) return false;
      seen.add(r.filmeId);
      return true;
    });

    return unique.map(r => ({
      movieId: r.filmeId,
      score: Number(r.nota),
      friendName: r.user?.username || 'Amigo',
      friendId: r.usuarioId,
    }));
  }
}
