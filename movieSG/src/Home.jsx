import React, { useEffect, useState } from "react";
import api from "./services/api";
import backendApi from "./services/backendApi";
import { Link } from 'react-router-dom';
import Cookies from 'universal-cookie';
import './css/Home2.css';

const TMDB_API_KEY = '7fbee966dcca15e34a84ff539e33c11b';

export default function Home() {

  const [filmes, setfilmes] = useState([]);
  const [filmes2, setfilmes2] = useState([]);
  const [filmes3, setfilmes3] = useState([]);
  const [filmesCartaz, setFilmesCartaz] = useState([]);
  const [friendsRecs, setFriendsRecs] = useState([]);
  const [userRecs, setUserRecs] = useState([]);
  const [showFriendsRecs, setShowFriendsRecs] = useState(true);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

  const cookies = new Cookies();
  const user = cookies.get('accessToken');

  useEffect(() => {
    async function loadFilmes() {
      const response = await api.get("movie/now_playing", {
        params: {
          api_key: TMDB_API_KEY,
          language: "pt-BR",
          page: 1,
        },
      });

      const filtered = response.data.results.filter(movie => 
        !movie.genre_ids.includes(27) && !movie.genre_ids.includes(53)
      );

      setfilmes(filtered.slice(0, 4));
    }

    async function loadFilmes2() {
      const response = await api.get("movie/popular", {
        params: {
          api_key: TMDB_API_KEY,
          language: "pt-BR",
          page: 2,
        },
      });

      setfilmes2(response.data.results.slice(0, 8));
    }

    async function loadFilmes3() {
      const response = await api.get("movie/top_rated", {
        params: {
          api_key: TMDB_API_KEY,
          language: "pt-BR",
          page: 3,
        },
      });

      setfilmes3(response.data.results.slice(0, 8));
    }

    async function loadFilmesCartaz() {
      const response = await api.get("movie/now_playing", {
        params: {
          api_key: TMDB_API_KEY,
          language: "pt-BR",
          page: 2,
        },
      });
      setFilmesCartaz(response.data.results.slice(0, 12));
    }

    async function loadFriendsRecs() {
      if (!user) return;
      try {
        const res = await backendApi.get(`/ratings/friends-recommendations/${user.id}`);
        const recs = res.data;
        if (!recs || recs.length === 0) return;

        const movieDetails = await Promise.all(
          recs.map(async (rec) => {
            try {
              const tmdb = await api.get(`movie/${rec.movieId}`, {
                params: { api_key: TMDB_API_KEY, language: 'pt-BR' }
              });
              return { ...tmdb.data, friendName: rec.friendName, friendId: rec.friendId, friendScore: rec.score };
            } catch {
              return null;
            }
          })
        );

        setFriendsRecs(movieDetails.filter(Boolean));
      } catch (e) {
        console.error('Erro ao carregar recomendações de amigos', e);
      }
    }

    async function loadUserRecs() {
      if (!user) return;
      try {
        const res = await backendApi.get(`/perfil/${user.id}`);
        const perfil = res.data;
        if (!perfil || !perfil.generos || perfil.generos.length === 0) return;

        const GENRE_MAP = {
          'Ação': 28, 'Aventura': 12, 'Animação': 16, 'Comédia': 35, 'Crime': 80,
          'Documentário': 99, 'Drama': 18, 'Fantasia': 14, 'Ficção Científica': 87,
          'Horror': 27, 'Musical': 10402, 'Romance': 10749, 'Suspense': 53,
          'Terror': 27, 'Western': 37
        };

        const genreIds = perfil.generos
          .map(g => GENRE_MAP[g.genero])
          .filter(Boolean)
          .slice(0, 3)
          .join(',');

        if (!genreIds) return;

        const response = await api.get("discover/movie", {
          params: {
            api_key: TMDB_API_KEY,
            language: "pt-BR",
            with_genres: genreIds,
            sort_by: "popularity.desc",
            page: 1,
          },
        });

        setUserRecs(response.data.results.slice(0, 8));
      } catch (e) {
        console.error('Erro ao carregar recomendações personalizadas', e);
      }
    }

    loadFilmes();
    loadFilmes2();
    loadFilmes3();
    loadFilmesCartaz();
    loadFriendsRecs();
    loadUserRecs();

    const checkProfile = async () => {
      const userData = cookies.get('accessToken');
      if (userData) {
        try {
          const res = await backendApi.get(`/perfil/${userData.id}`);
          if (!res.data || (!res.data.fotoBase64 && !res.data.bio)) {
            setShowProfilePrompt(true);
          }
        } catch (e) {
          setShowProfilePrompt(true);
        }
      }
    };
    checkProfile();
    
  }, []);

  return (
    <div className="home-container">
      {filmes.length > 0 && (
        <section className="hero" style={{
          backgroundImage: `var(--hero-overlay), url(https://image.tmdb.org/t/p/original/${filmes[0].backdrop_path})`
        }}>
          <div className="hero-content">
            <h1 className="hero-title">{filmes[0].title}</h1>
            <p className="hero-overview">{filmes[0].overview.substring(0, 150)}...</p>
            <div className="hero-buttons">
              <Link to={`/Filmee/${filmes[0].id}`} className="btn-primary">Ver Mais</Link>
            </div>
          </div>
        </section>
      )}

      <main className="content">

        {/* Seção de Recomendações de Amigos — só aparece se logado e tiver dados */}
        {user && friendsRecs.length > 0 && (
          <section className={`category-section friends-recs-section ${!showFriendsRecs ? 'collapsed' : ''}`}>
            <h2 className="section-title accordion-header" onClick={() => setShowFriendsRecs(!showFriendsRecs)}>
              <div className="title-text-group">
                👥 Aprovados pelos seus Amigos
                <span className="friends-recs-subtitle">Filmes que seus amigos avaliaram com nota 7 ou mais</span>
              </div>
              <span className={`accordion-arrow ${showFriendsRecs ? 'open' : ''}`}>▼</span>
            </h2>
            <div className="accordion-content">
              <div className="movie-grid">
                {friendsRecs.map((filme) => (
                  <article key={filme.id} className="movie-card friends-rec-card">
                    <Link to={`/Filmee/${filme.id}`} className="card-inner">
                      <img
                        className="card-img"
                        src={filme.poster_path
                          ? `https://image.tmdb.org/t/p/w500/${filme.poster_path}`
                          : 'https://via.placeholder.com/500x750?text=Imagem+Indispon%C3%ADvel'
                        }
                        alt={filme.title}
                      />
                      <div className="card-overlay">
                        <strong className="card-title">{filme.title}</strong>
                        <div className="friends-rec-badge">
                          <span className="friends-rec-score">⭐ {filme.friendScore}/10</span>
                          <span className="friends-rec-friend">@{filme.friendName}</span>
                        </div>
                        <span className="card-link">Detalhes</span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Seção: Recomendados baseados nos seus gêneros — só aparece se logado e tiver dados */}
        {user && userRecs.length > 0 && (
          <section className="category-section user-recs-section">
            <h2 className="section-title">
              ⭐ Recomendados para Você
              <span className="user-recs-subtitle">Baseado nos gêneros que você mais gosta</span>
            </h2>
            <div className="movie-grid">
              {userRecs.map((filme) => (
                <article key={filme.id} className="movie-card user-rec-card">
                  <Link to={`/Filmee/${filme.id}`} className="card-inner">
                    <img
                      className="card-img"
                      src={filme.poster_path
                        ? `https://image.tmdb.org/t/p/w500/${filme.poster_path}`
                        : 'https://via.placeholder.com/500x750?text=Imagem+Indispon%C3%ADvel'
                      }
                      alt={filme.title}
                    />
                    <div className="card-overlay">
                      <strong className="card-title">{filme.title}</strong>
                      <span className="card-link">Detalhes</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="category-section">
          <h2 className="section-title">Destaques</h2>
          <div className="movie-grid">
            {filmes.map((filme) => (
              <article key={filme.id} className="movie-card">
                <Link to={`/Filmee/${filme.id}`} className="card-inner">
                  <img className="card-img" src={filme.poster_path ? `https://image.tmdb.org/t/p/w500/${filme.poster_path}` : 'https://via.placeholder.com/500x750?text=Imagem+Indispon%C3%ADvel'} alt={filme.title} />
                  <div className="card-overlay">
                    <strong className="card-title">{filme.title}</strong>
                    <span className="card-link">Detalhes</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Seção Em Cartaz — Simplificada */}
        {filmesCartaz.length > 0 && (
          <section className="category-section">
            <h2 className="section-title"> Em Cartaz</h2>
            <div className="movie-grid">
              {filmesCartaz.map((filme) => (
                <article key={filme.id} className="movie-card">
                  <Link to={`/Filmee/${filme.id}`} className="card-inner">
                    <img
                      className="card-img"
                      src={filme.poster_path
                        ? `https://image.tmdb.org/t/p/w500/${filme.poster_path}`
                        : 'https://via.placeholder.com/500x750?text=Imagem+Indispon%C3%ADvel'
                      }
                      alt={filme.title}
                    />
                    <div className="card-overlay">
                      <strong className="card-title">{filme.title}</strong>
                      <span className="card-link">Detalhes</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="category-section">
          <h2 className="section-title">Populares</h2>
          <div className="movie-grid">
            {filmes2.map((filme) => (
              <article key={filme.id} className="movie-card">
                <Link to={`/Filmee/${filme.id}`} className="card-inner">
                  <img className="card-img" src={filme.poster_path ? `https://image.tmdb.org/t/p/w500/${filme.poster_path}` : 'https://via.placeholder.com/500x750?text=Imagem+Indispon%C3%ADvel'} alt={filme.title} />
                  <div className="card-overlay">
                    <strong className="card-title">{filme.title}</strong>
                    <span className="card-link">Detalhes</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="category-section">
          <h2 className="section-title">Mais Votados</h2>
          <div className="movie-grid">
            {filmes3.map((filme) => (
              <article key={filme.id} className="movie-card">
                <Link to={`/Filmee/${filme.id}`} className="card-inner">
                  <img className="card-img" src={filme.poster_path ? `https://image.tmdb.org/t/p/w500/${filme.poster_path}` : 'https://via.placeholder.com/500x750?text=Imagem+Indispon%C3%ADvel'} alt={filme.title} />
                  <div className="card-overlay">
                    <strong className="card-title">{filme.title}</strong>
                    <span className="card-link">Detalhes</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Modal de Lembrete de Perfil */}
      {showProfilePrompt && (
        <div className="profile-prompt-overlay">
          <div className="profile-prompt-card">
            <div className="prompt-content">
              <h2>🎨 Deseja configurar o seu perfil agora?</h2>
              <p>Você pode adicionar foto, biografia, seus gêneros favoritos e muito mais!</p>
              <div className="prompt-actions">
                <button className="btn-prompt-later" onClick={() => setShowProfilePrompt(false)}>Agora não</button>
                <Link to="/Perfil" className="btn-prompt-now" onClick={() => setShowProfilePrompt(false)}>Configurar Perfil</Link>
              </div>
              <p className="prompt-tip">💡 Você também pode acessar o perfil pelo menu no topo a qualquer momento.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
