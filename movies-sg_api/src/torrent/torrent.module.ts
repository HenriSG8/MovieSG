import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TorrentController } from './torrent.controller';
import { TorrentService } from './torrent.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  controllers: [TorrentController],
  providers: [TorrentService],
  exports: [TorrentService],
})
export class TorrentModule {}
