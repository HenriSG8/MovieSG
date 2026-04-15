import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { SavedMovieService } from './saved-movie.service';

@Controller('saved-movies')
export class SavedMovieController {
  constructor(private readonly savedMovieService: SavedMovieService) {}

  @Post()
  async add(@Body() data: { userId: number, movieId: number, movieTitle: string, moviePoster?: string }) {
    return this.savedMovieService.addSavedMovie(data);
  }

  @Get(':userId')
  async list(@Param('userId') userId: string) {
    return this.savedMovieService.getSavedMoviesByUser(+userId);
  }

  @Get('check/:userId/:movieId')
  async check(@Param('userId') userId: string, @Param('movieId') movieId: string) {
    const favorited = await this.savedMovieService.isSaved(+userId, +movieId);
    return { favorited };
  }

  @Delete(':userId/:movieId')
  async remove(@Param('userId') userId: string, @Param('movieId') movieId: string) {
    return this.savedMovieService.removeSavedMovie(+userId, +movieId);
  }
}
