import { Controller, Get, Param, Req, Res, Headers, HttpStatus, NotFoundException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { TorrentService } from './torrent.service';

@Controller('torrent/stream')
export class TorrentStreamController {
  private readonly logger = new Logger(TorrentStreamController.name);

  constructor(private readonly torrentService: TorrentService) {}

  @Get(':hash')
  async streamVideo(
    @Param('hash') hash: string,
    @Req() req: Request,
    @Res() res: Response,
    @Headers('range') rangeHeader: string,
  ) {
    try {
      const magnetLink = this.torrentService.buildMagnetLink(hash, 'Stream');
      const { file, torrent } = await this.torrentService.downloadAndGetStreamFile(magnetLink);

      if (!file) {
         this.logger.error(`Arquivo de vídeo não encontrado no torrent: ${hash}`);
         throw new NotFoundException('Arquivo de vídeo não encontrado no torrent.');
      }

      const fileSize = file.length;

      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize) {
          res.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).send(`Requested range not satisfiable\n${start}-${end}/${fileSize}`);
          return;
        }

        const chunksize = (end - start) + 1;
        const stream = file.createReadStream({ start, end });

        res.writeHead(HttpStatus.PARTIAL_CONTENT, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4', // Na dúvida, mp4 é amplamente suportado ou pode definir dinamicamente baseado na extensão
        });

        stream.pipe(res);

        // Se a conexão for fechada prematuramente (usuário parou o video)
        res.on('close', () => {
          stream.destroy();
        });

      } else {
        res.writeHead(HttpStatus.OK, {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        });
        const stream = file.createReadStream();
        stream.pipe(res);

        res.on('close', () => {
          stream.destroy();
        });
      }
    } catch (err) {
      this.logger.error(`Erro no stream: ${err.message}`);
      if (!res.headersSent) {
         res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Erro ao inicializar o stream: ' + err.message + '\n' + err.stack);
      }
    }
  }
}
