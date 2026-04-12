import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface TorrentResult {
  quality: string;
  type: string;
  hash: string;
  magnetLink: string;
  size: string;
  seeds: number;
  peers: number;
}

export interface TorrentSearchResponse {
  movieTitle: string;
  year: number;
  torrents: TorrentResult[];
}

@Injectable()
export class TorrentService {
  private readonly logger = new Logger(TorrentService.name);

  // Lista de trackers públicos confiáveis
  private readonly TRACKERS = [
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://open.tracker.cl:1337/announce',
    'udp://tracker.openbittorrent.com:6969/announce',
    'udp://open.stealth.si:80/announce',
    'udp://exodus.desync.com:6969/announce',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://tracker.tiny-vps.com:6969/announce',
    'udp://tracker.moeking.me:6969/announce',
    'udp://explodie.org:6969/announce',
    'udp://tracker.theoks.net:6969/announce',
  ];

  constructor(private readonly httpService: HttpService) {}

  /**
   * Busca torrents na API YTS usando o IMDb ID.
   * Formata os magnet links com trackers populares.
   */
  async searchByImdbId(imdbId: string): Promise<TorrentSearchResponse | null> {
    try {
      // Parâmetro do Torrentio para forçar prioridade PT na pesquisa global
      const url = `https://torrentio.strem.fun/language=portuguese/stream/movie/${imdbId}.json`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 8000,
        }),
      );

      const data = response.data;

      if (!data || !data.streams || data.streams.length === 0) {
        this.logger.warn(`Nenhum stream do Torrentio encontrado para: ${imdbId}`);
        return null;
      }

      const torrents: TorrentResult[] = data.streams
        .filter((stream) => stream.infoHash) // Só queremos torrents (magnet base)
        .slice(0, 30) // Pegar os primeiros 30 para termos margem de filtro
        .map((stream: any) => {
          const titleLines = (stream.title || '').split('\n');
          const lastLine = titleLines[titleLines.length - 1] || '';
          const fullTitleLower = (stream.title || '').toLowerCase();
          
          let seeds = 0;
          let size = 'N/A';
          let language = 'Original (EN)';
          
          // Extrair seeds usando Regex (ícone 👤)
          const seedMatch = lastLine.match(/👤\s*(\d+)/);
          if (seedMatch) seeds = parseInt(seedMatch[1], 10);

          // Extrair size usando Regex (ícone 💾 e ⚙️)
          const sizeMatch = lastLine.match(/💾\s*(.*?)\s*⚙️/);
          if (sizeMatch) size = sizeMatch[1].trim();

          // Identificar idioma com regras estendidas para trackers do BR
          const brKeywords = [
            'dublado', 'dual', 'pt-br', 'ptbr', 'nacional', 
            'comando', 'bludv', 'lapumia', 'brazuca', '🇵🇹'
          ];
          
          const isBrazilian = brKeywords.some(kw => fullTitleLower.includes(kw));

          if (isBrazilian) {
            language = 'Dublado (PT-BR)';
          }

          // Extrair qualidade do field 'name'
          const nameLines = (stream.name || '').split('\n');
          let quality = nameLines[1] || 'Unknown';
          
          const hash = stream.infoHash;
          const magnetLink = this.buildMagnetLink(hash, titleLines[0] || 'Unknown Movie');

          return {
            quality: quality,
            type: 'torrent',
            hash: hash,
            magnetLink: magnetLink,
            size: size,
            seeds: seeds,
            peers: 0,
            language: language,
          };
        })
        .filter((t) => t.language === 'Dublado (PT-BR)'); // FILTRO RESTRITO: Apenas PT-BR

      if (torrents.length === 0) {
        return null; // Força erro 404 de "Não encontrado" se não sobrar nenhum arquivo nacional.
      }

      // Ordenar por número de seeds (já que todos agora são PT-BR)
      torrents.sort((a, b) => b.seeds - a.seeds);

      return {
        movieTitle: 'Torrentio Aggregated Results',
        year: 0,
        torrents,
      };
    } catch (error) {
      this.logger.error(`Falha ao conectar no Torrentio para ${imdbId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Gera um magnet link standalone a partir de um hash e título.
   */
  buildMagnetLink(hash: string, title: string): string {
    const encodedTitle = encodeURIComponent(title);
    const trackerParams = this.TRACKERS.map(
      (tr) => `&tr=${encodeURIComponent(tr)}`,
    ).join('');

    return `magnet:?xt=urn:btih:${hash}&dn=${encodedTitle}${trackerParams}`;
  }
}
