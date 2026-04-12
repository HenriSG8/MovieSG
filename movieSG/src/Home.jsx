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
  const [friendsRecs, setFriendsRecs] = useState([]);

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
  
      setfilmes(response.data.results.slice(8,12));
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

    async function loadFriendsRecs() {
      if (!user) return;
      try {
        const res = await backendApi.get(`/ratings/friends-recommendations/${user.id}`);
        const recs = res.data;
        if (!recs || recs.length === 0) return;

        // Busca detalhes de cada filme no TMDB em paralelo
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

    loadFilmes();
    loadFilmes2();
    loadFilmes3();
    loadFriendsRecs();
    
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
              <Link to={`/Filmee/${filmes[0].id}`} className="btn-primary">Assistir Agora</Link>
              <button className="btn-secondary" onClick={() => window.scrollTo({top: 800, behavior: 'smooth'})}>Ver Mais</button>
            </div>
          </div>
        </section>
      )}

      <main className="content">

        {/* Seção de Recomendações de Amigos — só aparece se logado e tiver dados */}
        {user && friendsRecs.length > 0 && (
          <section className="category-section friends-recs-section">
            <h2 className="section-title">
              👥 Aprovados pelos seus Amigos
              <span className="friends-recs-subtitle">Filmes que seus amigos avaliaram com nota 7 ou mais</span>
            </h2>
            <div className="movie-grid">
              {friendsRecs.map((filme) => (
                <article key={filme.id} className="movie-card friends-rec-card">
                  <Link to={`/Filmee/${filme.id}`} className="card-inner">
                    <img
                      className="card-img"
                      src={filme.poster_path
                        ? `https://image.tmdb.org/t/p/w500/${filme.poster_path}`
                        : 'https://via.placeholder.com/500x750?text=Sem+Capa'
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
          </section>
        )}

        <section className="category-section">
          <h2 className="section-title">Destaques</h2>
          <div className="movie-grid">
            {filmes.map((filme) => (
              <article key={filme.id} className="movie-card">
                <Link to={`/Filmee/${filme.id}`} className="card-inner">
                  <img className="card-img" src={`https://image.tmdb.org/t/p/w500/${filme.poster_path}`} alt={filme.title} />
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
          <h2 className="section-title">Populares</h2>
          <div className="movie-grid">
            {filmes2.map((filme) => (
              <article key={filme.id} className="movie-card">
                <Link to={`/Filmee/${filme.id}`} className="card-inner">
                  <img className="card-img" src={`https://image.tmdb.org/t/p/w500/${filme.poster_path}`} alt={filme.title} />
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
                  <img className="card-img" src={`https://image.tmdb.org/t/p/w500/${filme.poster_path}`} alt={filme.title} />
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
    </div>
  );
}
