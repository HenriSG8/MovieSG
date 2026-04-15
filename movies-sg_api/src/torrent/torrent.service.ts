import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Cron } from '@nestjs/schedule';
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
  private client: any;
  private readonly tempDir = path.join(process.cwd(), 'temp_movies');

  // Lista robusta de trackers globais (UDP e WebSockets)
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

  constructor(private readonly httpService: HttpService) {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    this.initWebTorrent();
  }

  private async initWebTorrent() {
    if (this.client) return;
    try {
      const module = await (eval(`import('webtorrent')`) as Promise<any>);
      const WebTorrent = module.default || module;
      this.client = new WebTorrent({
        utp: false,     // Mantido falso para evitar erro de permissão no Windows
        dht: true,      // Tenta encontrar peers sem trackers
        lsd: true,      // Local Service Discovery
        tracker: true,
        // Configurações para tentar furar bloqueios de provedores (ISPs)
        encrypt: true   // Força criptografia para evitar detecção de tráfego BitTorrent
      });
      this.logger.log('WebTorrent module initialized (Encryption/DHT/LSD enabled).');
    } catch (err) {
      this.logger.error('Erro ao importar WebTorrent: ' + err.message);
    }
  }

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
          const magnetLink = this.buildMagnetLink(hash, fullTitle.split('\n')[0] || 'Unknown Movie');

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

      // Ordenar: Dublado c/ Seeds > Dublado s/ Seeds > Inglês c/ Seeds
      torrents.sort((a, b) => {
        const scoreA = (a.language?.includes('PT-BR') ? 1000 : 0) + a.seeds;
        const scoreB = (b.language?.includes('PT-BR') ? 1000 : 0) + b.seeds;
        return scoreB - scoreA;
      });

      return {
        movieTitle: 'Torrentio Aggregated Results',
        year: 0,
        torrents: torrents.slice(0, 20),
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

  /**
   * Baixa o torrent e retorna o arquivo principal de vídeo para o stream.
   */
  async downloadAndGetStreamFile(magnetLink: string): Promise<{ file: any; torrent: any }> {
    if (!this.client) {
      await this.initWebTorrent();
    }
    
    return new Promise((resolve, reject) => {
      const existing = this.client.get(magnetLink);

      const onTorrentReady = (torrent: any) => {
        if (torrent.files && torrent.files.length > 0) {
          try { this.resolveVideoFile(torrent, resolve, reject); } catch(e) { reject(e); }
          return;
        }

        this.logger.log('Aguardando metadados (Encrypted Handshake)...');
        const checkInterval = setInterval(() => {
          const dhtNodes = this.client.dht ? (this.client.dht.nodes ? Object.keys(this.client.dht.nodes).length : 0) : 0;
          this.logger.log(`Rede: Peers: ${torrent.numPeers || 0} | DHT: ${dhtNodes} | Progresso: ${(torrent.progress * 100).toFixed(2)}%`);
          
          if (torrent.files && torrent.files.length > 0) {
            clearInterval(checkInterval);
            try { this.resolveVideoFile(torrent, resolve, reject); } catch(e) { reject(e); }
          }
        }, 2000);

        setTimeout(() => {
          clearInterval(checkInterval);
          if (!torrent.files || torrent.files.length === 0) {
            const dhtNodes = this.client.dht ? (this.client.dht.nodes ? Object.keys(this.client.dht.nodes).length : 0) : 0;
            const errorMsg = `Timeout Local: DHCP/ISP Bloqueio. Nodes: ${dhtNodes}. Considere testar no Servidor Final.`;
            this.logger.error(errorMsg);
            try { this.client.remove(torrent.infoHash || magnetLink); } catch (e) {}
            reject(new Error(errorMsg));
          }
        }, 60000);
      };

      if (existing) {
        this.logger.log('Restaurando sessão de download existente...');
        onTorrentReady(existing);
        return;
      }

      this.logger.log(`Iniciando download no servidor para: ${magnetLink.slice(0, 50)}...`);
      
      try {
        this.client.add(magnetLink, { path: this.tempDir }, (torrent: any) => {
          onTorrentReady(torrent);
        });
      } catch (err) {
        reject(new Error('Erro interno ao adicionar magnetLink: ' + err.message));
      }
    });
  }

  private resolveVideoFile(torrent: any, resolve: Function, reject: Function) {
    if (!torrent.files || torrent.files.length === 0) {
        reject(new Error('Não foi possível obter a lista de arquivos (metadata pendente).'));
        return;
    }

    // Escolher o vídeo de forma inteligente
    const videoExts = ['.mp4', '.mkv', '.webm', '.avi', '.m4v'];
    let file = torrent.files.find((f: any) => {
      return videoExts.some(ext => f.name.toLowerCase().endsWith(ext));
    });

    // Se não tiver nenhum que bate com a extensão da lista, pegar o maior arquivo.
    if (!file && torrent.files.length > 0) {
      file = torrent.files.reduce((a: any, b: any) => a.length > b.length ? a : b);
    }

    if (!file) {
      reject(new Error('Nenhum vídeo encontrado no torrent.'));
      return;
    }

    // Prioriza o início e o fim do arquivo para viabilizar o play antes de baixar tudo (streaming)
    file.select(); 
    resolve({ file, torrent });
  }

  @Cron('0 */4 * * *')
  handleCleanup() {
    this.logger.log('Iniciando limpeza de arquivos temporários de torrent (Cron Job 4h)...');
    
    // Destrói ativamente todos os torrents no client para liberar os arquivos em uso (unlink)
    this.client.torrents.forEach((torrent: any) => {
      try {
        this.client.remove(torrent.infoHash, { destroyStore: true }, (err: any) => {
          if (err) this.logger.error(`Erro ao destruir cache do torrent: ${err}`);
        });
      } catch (e) {
        this.logger.error('Erro ao remover torrent no cleanup: ' + e.message);
      }
    });

    // Apaga a pasta física e a recria (garante que tudo sumiu)
    if (fs.existsSync(this.tempDir)) {
      try {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      } catch (error) {
        this.logger.error(`Falha ao limpar pasta temporária: ${error.message}`);
      }
    }
    
    setTimeout(() => {
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
    }, 1000);

    this.logger.log('Limpeza da pasta de torrents concluída agressivamente.');
  }
}
