import React, { useEffect  ,useState } from "react";
import api from "./services/api";
import {Link} from 'react-router-dom';
import './css/Home2.css';

export default function Home() {
  
  const [filmes, setfilmes ] = useState([]);
  const [filmes2, setfilmes2] = useState([]);
  const [filmes3, setfilmes3] = useState([]);

  useEffect(() => {
    async function loadFilmes() {
      const response = await api.get("movie/now_playing", {
        params: {
          api_key: "7fbee966dcca15e34a84ff539e33c11b",
          language: "pt-BR",
          page: 1,
        },
      });
  
      setfilmes(response.data.results.slice(8,12 ));
    }
  
    async function loadFilmes2() {
      const response = await api.get("movie/popular", {
        params: {
          api_key: "7fbee966dcca15e34a84ff539e33c11b",
          language: "pt-BR",
          page: 2,
        },
      });
  
      setfilmes2(response.data.results.slice(0, 8));
    }
  
    async function loadFilmes3() {
        const response = await api.get("movie/top_rated", {
          params: {
            api_key: "7fbee966dcca15e34a84ff539e33c11b",
            language: "pt-BR",
            page: 3,
          },
        });
    
        setfilmes3(response.data.results.slice(0, 8));
      }

    loadFilmes();
    loadFilmes2();
    loadFilmes3();
    
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
