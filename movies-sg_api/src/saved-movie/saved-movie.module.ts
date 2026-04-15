import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedMovieService } from './saved-movie.service';
import { SavedMovieController } from './saved-movie.controller';
import { SavedMovie } from './entities/saved-movie.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SavedMovie])],
  controllers: [SavedMovieController],
  providers: [SavedMovieService],
  exports: [SavedMovieService],
})
export class SavedMovieModule {}
