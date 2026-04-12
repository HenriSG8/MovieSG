import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "./services/api";
import "./css/Home2.css";

export default function Categoria() {
    const { id, name } = useParams();
    const [filmes, setFilmes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        async function loadInitialFilmes() {
            setLoading(true);
            setPage(1);
            try {
                const response = await api.get("discover/movie", {
                    params: {
                        api_key: "7fbee966dcca15e34a84ff539e33c11b",
                        language: "pt-BR",
                        with_genres: id,
                        sort_by: "popularity.desc",
                        page: 1,
                    },
                });
                setFilmes(response.data.results);
                setHasMore(response.data.page < response.data.total_pages);
            } catch (error) {
                console.error("Erro ao buscar filmes por categoria: ", error);
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            loadInitialFilmes();
        }
    }, [id]);

    async function handleLoadMore() {
        if (loadingMore || !hasMore) return;
        
        setLoadingMore(true);
        const nextPage = page + 1;
        
        try {
            const response = await api.get("discover/movie", {
                params: {
                    api_key: "7fbee966dcca15e34a84ff539e33c11b",
                    language: "pt-BR",
                    with_genres: id,
                    sort_by: "popularity.desc",
                    page: nextPage,
                },
            });
            
            setFilmes(prev => [...prev, ...response.data.results]);
            setPage(nextPage);
            setHasMore(response.data.page < response.data.total_pages);
        } catch (error) {
            console.error("Erro ao carregar mais filmes: ", error);
        } finally {
            setLoadingMore(false);
        }
    }

    return (
        <div className="home-container">
            <main className="content">
                <section className="category-section">
                    <h2 className="section-title">
                        Categoria: <span style={{ color: "var(--primary)" }}>{name}</span>
                    </h2>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "50px 0" }}>Carregando filmes...</div>
                    ) : filmes.length > 0 ? (
                        <>
                            <div className="movie-grid">
                                {filmes.map((filme, index) => (
                                    <article key={`${filme.id}-${index}`} className="movie-card">
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
                            
                            {hasMore && (
                                <div className="load-more-container">
                                    <button 
                                        className="btn-load-more" 
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                    >
                                        {loadingMore ? "Carregando..." : "Ver Mais Filmes"}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: "center", padding: "50px 0", fontSize: "1.2rem" }}>
                            Nenhum filme encontrado para a categoria "{name}".
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
