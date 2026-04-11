import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "./services/api";
import "./css/Home2.css"; // Reuse the grid styles

export default function Pesquisa() {
  const { query } = useParams();
  const [filmes, setFilmes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function searchFilmes() {
      setLoading(true);
      try {
        const response = await api.get("search/movie", {
          params: {
            api_key: "7fbee966dcca15e34a84ff539e33c11b",
            language: "pt-BR",
            query: query,
            page: 1,
            include_adult: false,
          },
        });
        setFilmes(response.data.results);
      } catch (error) {
        console.error("Erro na busca: ", error);
      } finally {
        setLoading(false);
      }
    }

    if (query) {
      searchFilmes();
    }
  }, [query]);

  return (
    <div className="home-container" style={{ paddingTop: '100px' }}>
      <main className="content">
        <section className="category-section">
          <h2 className="section-title">
            Resultados para: <span style={{ color: "var(--primary)" }}>{query}</span>
          </h2>
          
          {loading ? (
            <div style={{ textAlign: "center", padding: "50px 0" }}>Buscando filmes...</div>
          ) : filmes.length > 0 ? (
            <div className="movie-grid">
              {filmes.map((filme) => (
                <article key={filme.id} className="movie-card">
                  <Link to={`/Filmee/${filme.id}`} className="card-inner">
                    {/* Fallback to a placeholder if there is no poster */}
                    <img 
                      className="card-img" 
                      src={filme.poster_path ? `https://image.tmdb.org/t/p/w500/${filme.poster_path}` : 'https://via.placeholder.com/500x750?text=Sem+Capa'} 
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
          ) : (
            <div style={{ textAlign: "center", padding: "50px 0", fontSize: "1.2rem" }}>
              Nenhum filme encontrado para "{query}".
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
