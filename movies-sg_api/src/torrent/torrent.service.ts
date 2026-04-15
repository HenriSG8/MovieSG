import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as path from 'path';
import * as fs from 'fs';

export interface TorrentResult {
  quality: string;
  type: string;
  hash: string;
  magnetLink: string;
  size: string;
  seeds: number;
  peers: number;
  language?: string;
}

export interface TorrentSearchResponse {
  movieTitle: string;
  year: number;
  torrents: TorrentResult[];
}

@Injectable()
export class TorrentService {
  private readonly logger = new Logger(TorrentService.name);
  
  // Lista robusta de trackers globais (UDP e WebSockets) para os Magnet Links
  private readonly TRACKERS = [
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.webtorrent.dev',
    'wss://tracker.files.fm:7073/announce',
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://open.tracker.cl:1337/announce',
    'udp://tracker.openbittorrent.com:6969/announce',
    'udp://exodus.desync.com:6969/announce',
    'udp://9.rarbg.com:2810/announce',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://tracker.moeking.me:6969/announce',
    'udp://ipv4.tracker.harry.lu:80/announce',
    'udp://bt2.archive.org:6969/announce'
  ];

  constructor(private readonly httpService: HttpService) {}

  /**
   * Busca torrents na API Torrentio usando o IMDb ID.
   * Formata os magnet links para download direto no cliente desktop.
   */
  async searchByImdbId(imdbId: string): Promise<TorrentSearchResponse | null> {
    try {
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
        .filter((stream) => stream.infoHash) 
        .map((stream: any) => {
          const fullTitle = (stream.title || '').replace(/\r/g, '');
          const fullTitleLower = fullTitle.toLowerCase();
          
          let seeds = 0;
          let size = 'N/A';
          let language = 'Original (EN)';
          
          const seedMatch = fullTitle.match(/👤\s*(\d+)/) || fullTitle.match(/Seeds:\s*(\d+)/i);
          if (seedMatch) seeds = parseInt(seedMatch[1], 10);

          const sizeMatch = fullTitle.match(/([0-9.]+\s*[GMK]B)/i);
          if (sizeMatch) size = sizeMatch[1].toUpperCase();

          const brKeywords = [
            'dublado', 'dual', 'pt-br', 'ptbr', 'nacional', 'brazilian',
            'portugues', 'p-br', 'brazuca', 'comando', 'bludv', 'lapumia'
          ];
          
          const isBrazilian = brKeywords.some(kw => fullTitleLower.includes(kw)) || 
                             fullTitleLower.includes('🇵🇹') || 
                             fullTitleLower.includes('🇧🇷');

          if (isBrazilian) {
            language = 'Dublado (PT-BR)';
          }

          const nameLines = (stream.name || '').split('\n');
          let quality = nameLines[1] || 'Unknown';
          
          const hash = stream.infoHash;
          const magnetLink = this.buildMagnetLink(hash, fullTitle.split('\n')[0] || 'Movie Download');

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
        });

      // Ordenar por dublagem e número de seeds
      torrents.sort((a, b) => {
        const scoreA = (a.language?.includes('PT-BR') ? 1000 : 0) + a.seeds;
        const scoreB = (b.language?.includes('PT-BR') ? 1000 : 0) + b.seeds;
        return scoreB - scoreA;
      });

      return {
        movieTitle: 'Resultados para Download',
        year: 0,
        torrents: torrents.slice(0, 20),
      };
    } catch (error) {
      this.logger.error(`Falha ao conectar no Torrentio: ${error.message}`);
      return null;
    }
  }

  /**
   * Gera um magnet link standalone a partir de um hash e título com trackers robustos.
   */
  buildMagnetLink(hash: string, title: string): string {
    const encodedTitle = encodeURIComponent(title);
    const trackerParams = this.TRACKERS.map(
      (tr) => `&tr=${encodeURIComponent(tr)}`,
    ).join('');

    return `magnet:?xt=urn:btih:${hash}&dn=${encodedTitle}${trackerParams}`;
  }
}
