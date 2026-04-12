import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { TorrentService } from './torrent.service';

@Controller('torrent')
export class TorrentController {
  constructor(private readonly torrentService: TorrentService) {}

  /**
   * Busca torrents por IMDb ID.
   * Exemplo: GET /torrent/search/tt0111161
   */
  @Get('search/:imdbId')
  async searchTorrents(@Param('imdbId') imdbId: string) {
    const result = await this.torrentService.searchByImdbId(imdbId);

    if (!result) {
      throw new NotFoundException(
        `Nenhum torrent encontrado para o IMDb ID: ${imdbId}`,
      );
    }

    return result;
  }
}
