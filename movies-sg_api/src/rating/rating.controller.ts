import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingDto } from './dtos/rating.dto';
import { Rating } from './entities/rating.entity';

@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  async saveRating(@Body() ratingDto: RatingDto): Promise<Rating> {
    return this.ratingService.createOrUpdate(ratingDto);
  }

  @Get('/summary/:movieId')
  async getSummary(@Param('movieId') movieId: number) {
    return this.ratingService.getRatingSummary(movieId);
  }

  @Get('/:movieId')
  async getRating(
    @Param('movieId') movieId: number,
    @Query('userId') userId: number,
  ): Promise<Rating> {
    return this.ratingService.findByUserAndMovie(userId, movieId);
  }

  @Get('/user/:userId')
  async getUserRatings(@Param('userId') userId: number): Promise<Rating[]> {
    return this.ratingService.findAllByUser(userId);
  }

  @Get('/friends-recommendations/:userId')
  async getFriendsRecommendations(@Param('userId', ParseIntPipe) userId: number) {
    return this.ratingService.getFriendsRecommendations(userId);
  }
}
