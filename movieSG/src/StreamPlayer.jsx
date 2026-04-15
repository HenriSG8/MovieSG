import { useState, useEffect, useRef, useCallback } from 'react';
import backendApi from './services/backendApi';
import './css/StreamPlayer.css';

/**
 * StreamPlayer — Módulo de Streaming P2P via WebTorrent.
 *
 * Props:
 * - imdbId:     IMDb ID do filme (ex: "tt0111161")
 * - movieTitle: Título do filme para exibição
 * - onClose:    Callback para fechar o player
 */
export default function StreamPlayer({ imdbId, movieTitle, onClose }) {
  // ─── Estados ───
  const [phase, setPhase] = useState('loading'); // loading | select | playing | error | unsupported
  const [torrents, setTorrents] = useState([]);
  const [selectedTorrent, setSelectedTorrent] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Stats em tempo real
  const [stats, setStats] = useState({
    progress: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    peers: 0,
    downloaded: 0,
    total: 0,
  });
  const [isBuffering, setIsBuffering] = useState(true);

  // Refs
  const clientRef = useRef(null);
  const torrentRef = useRef(null);
  const videoRef = useRef(null);
  const statsIntervalRef = useRef(null);

  // ─── Buscar torrents ao montar ───
  useEffect(() => {
    if (!imdbId) {
      setPhase('error');
      setErrorMsg('IMDb ID não disponível para este filme.');
      return;
    }

    async function fetchTorrents() {
      try {
        const res = await backendApi.get(`/torrent/search/${imdbId}`);
        if (res.data && res.data.torrents && res.data.torrents.length > 0) {
          setTorrents(res.data.torrents);
          setPhase('select');
        } else {
          setPhase('error');
          setErrorMsg('Nenhum torrent disponível para este filme.');
        }
      } catch (err) {
        console.error('Erro ao buscar torrents:', err);
        if (err.response && err.response.status === 404) {
          setPhase('error');
          setErrorMsg('Nenhum torrent encontrado para este filme na base YTS.');
        } else {
          setPhase('error');
          setErrorMsg('Erro de conexão ao buscar torrents. Tente novamente.');
        }
      }
    }

    fetchTorrents();
  }, [imdbId]);

  // ─── Cleanup ao desmontar ───
  useEffect(() => {
    return () => {
      cleanupTorrent();
    };
  }, []);

  const cleanupTorrent = useCallback(() => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    if (torrentRef.current) {
      try { torrentRef.current.destroy(); } catch (e) { /* ignore */ }
      torrentRef.current = null;
    }
    if (clientRef.current) {
      try { clientRef.current.destroy(); } catch (e) { /* ignore */ }
      clientRef.current = null;
    }
  }, []);

  // ─── Iniciar streaming via Servidor ───
  const startStreaming = useCallback((torrent) => {
    setSelectedTorrent(torrent);
    setPhase('playing');
    setIsBuffering(true);
    setStats({ progress: 0, downloadSpeed: 0, uploadSpeed: 0, peers: 0, downloaded: 0, total: 0 });

  }, []);

  // ─── Handlers ───
  const handleClose = useCallback(() => {
    cleanupTorrent();
    onClose();
  }, [cleanupTorrent, onClose]);

  const handleStopStream = useCallback(() => {
    cleanupTorrent();
    setPhase('select');
    setSelectedTorrent(null);
    setIsBuffering(true);
    setStats({ progress: 0, downloadSpeed: 0, uploadSpeed: 0, peers: 0, downloaded: 0, total: 0 });
  }, [cleanupTorrent]);

  const handleBackToSelect = useCallback(() => {
    cleanupTorrent();
    setPhase('select');
    setSelectedTorrent(null);
  }, [cleanupTorrent]);

  // ─── Utilitários de formatação ───
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatSpeed = (bps) => {
    if (!bps || bps === 0) return '0 B/s';
    return formatBytes(bps) + '/s';
  };

  const getQualityClass = (quality) => {
    if (quality.includes('2160')) return 'q-2160p';
    if (quality.includes('1080')) return 'q-1080p';
    if (quality.includes('720')) return 'q-720p';
    return 'q-480p';
  };

  // ─── Render bloqueio de scroll ───
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Press Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  return (
    <div className="stream-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="stream-container">
        {/* ─── Header ─── */}
        <div className="stream-header">
          <div className="stream-header-info">
            <div className="stream-header-icon">▶</div>
            <div className="stream-header-text">
              <h3>{movieTitle || 'Streaming P2P'}</h3>
              <span>WebTorrent • Conexão Peer-to-Peer</span>
            </div>
          </div>
          <button className="stream-close-btn" onClick={handleClose} title="Fechar (Esc)">
            ✕
          </button>
        </div>

        {/* ─── Body ─── */}
        <div className="stream-body">
          {/* Loading */}
          {phase === 'loading' && (
            <div className="stream-loading">
              <div className="stream-spinner" />
              <p>Buscando fontes disponíveis...</p>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="stream-error">
              <div className="stream-error-icon">⚠️</div>
              <h4>Não foi possível obter o stream</h4>
              <p>{errorMsg}</p>
              {selectedTorrent && (
                <a
                  href={selectedTorrent.magnetLink}
                  className="stream-magnet-btn"
                  title="Abrir no cliente de torrent do desktop"
                >
                  🧲 Abrir Magnet Link no Desktop
                </a>
              )}
            </div>
          )}

          {/* Quality Selection */}
          {phase === 'select' && (
            <div className="stream-quality-section">
              <div className="stream-quality-title">Selecione a qualidade</div>
              <div className="stream-quality-grid">
                {torrents.map((t, idx) => (
                  <div
                    key={idx}
                    className="stream-quality-card"
                    onClick={() => startStreaming(t)}
                  >
                      <div className="stream-quality-card-header">
                        <span className={`stream-quality-badge ${getQualityClass(t.quality)}`}>
                          {t.quality}
                        </span>
                        <span className="stream-quality-type">
                          {t.type} {t.language && <span style={{ fontWeight: '500', marginLeft: '6px', color: '#ffb347' }}>• 🗣️ {t.language}</span>}
                        </span>
                      </div>
                    <div className="stream-quality-stats">
                      <div className="stream-stat">
                        <span className="stream-stat-icon">💾</span>
                        <span className="stream-stat-value">{t.size}</span>
                      </div>
                      <div className="stream-stat">
                        <span className="stream-stat-icon">🌱</span>
                        <span className="stream-stat-value">{t.seeds}</span>
                        <span>seeds</span>
                      </div>
                      <div className="stream-stat">
                        <span className="stream-stat-icon">👥</span>
                        <span className="stream-stat-value">{t.peers}</span>
                        <span>peers</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fallback: magnet link direto */}
              <div className="stream-fallback-section">
                {torrents[0] && (
                  <a href={torrents[0].magnetLink} className="stream-magnet-btn">
                    🧲 Abrir Magnet Link no Cliente Desktop
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Player */}
          {phase === 'playing' && (
            <div className="stream-player-section">
              {/* Video */}
              <div className="stream-video-wrapper">
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el) {
                      el.onwaiting = () => setIsBuffering(true);
                      el.onplaying = () => setIsBuffering(false);
                      el.oncanplay = () => setIsBuffering(false);
                    }
                  }}
                  controls
                  autoPlay
                  playsInline
                  id="stream-video-element"
                  src={`http://localhost:3001/torrent/stream/${selectedTorrent.hash}`}
                />
                {isBuffering && (
                  <div className="stream-buffering-overlay">
                    <div className="stream-buffering-pulse" />
                    <span className="stream-buffering-text">Carregando stream P2P...</span>
                  </div>
                )}
              </div>

              {/* Progress */}
              <div className="stream-progress-container">
                <div className="stream-progress-header">
                  <span className="stream-progress-label">Progresso do Download</span>
                  <span className="stream-progress-percent">
                    {(stats.progress * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="stream-progress-track">
                  <div
                    className="stream-progress-fill"
                    style={{ width: `${Math.max(stats.progress * 100, 0.5)}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="stream-stats-bar">
                <div className="stream-stats-left">
                  <div className="stream-live-stat">
                    <span className="stat-icon">🌐</span>
                    <span className="stat-label">Peers</span>
                    <span className="stat-value highlight">{stats.peers}</span>
                  </div>
                  <div className="stream-live-stat">
                    <span className="stat-icon">⬇️</span>
                    <span className="stat-label">Download</span>
                    <span className="stat-value">{formatSpeed(stats.downloadSpeed)}</span>
                  </div>
                  <div className="stream-live-stat">
                    <span className="stat-icon">⬆️</span>
                    <span className="stat-label">Upload</span>
                    <span className="stat-value">{formatSpeed(stats.uploadSpeed)}</span>
                  </div>
                </div>
                <div className="stream-stats-right">
                  <div className="stream-live-stat">
                    <span className="stat-icon">💾</span>
                    <span className="stat-label">Baixado</span>
                    <span className="stat-value">{formatBytes(stats.downloaded)} / {formatBytes(stats.total)}</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="stream-player-controls">
                <button className="stream-ctrl-btn" onClick={handleBackToSelect}>
                  ← Alterar Qualidade
                </button>
                <button className="stream-ctrl-btn danger" onClick={handleStopStream}>
                  ⏹ Parar Stream
                </button>
                {selectedTorrent && (
                  <a href={selectedTorrent.magnetLink} className="stream-ctrl-btn">
                    🧲 Magnet Link
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Unsupported */}
          {phase === 'unsupported' && (
            <div className="stream-not-supported">
              <div className="stream-error-icon">🔧</div>
              <h4>Streaming P2P Erro ou Não Suportado</h4>
              <p>
                {errorMsg || 'Seu navegador não suporta WebRTC ou você está acessando o site sem HTTPS (rede local insegura).'}
              </p>
              <br/>
              <p style={{fontSize: '0.9em', color: '#ccc'}}>
                Se você não conseguir resolver, use o botão abaixo para baixar o torrent diretamente pelo seu gerenciador de downloads favorito (como qBittorrent, Transmission ou uTorrent).
              </p>
              {selectedTorrent && (
                <a href={selectedTorrent.magnetLink} className="stream-desktop-btn">
                  🧲 Abrir no Cliente Desktop
                </a>
              )}
              <button className="stream-ctrl-btn" onClick={handleBackToSelect} style={{ marginTop: '8px' }}>
                ← Voltar para seleção
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
