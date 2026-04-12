import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Cookies from 'universal-cookie';
import backendApi from './services/backendApi';
import './css/PerfilAmigo.css';

export default function PerfilAmigo() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const cookies = new Cookies();
    const userLogado = cookies.get('accessToken');

    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!userLogado) {
            navigate('/Login');
            return;
        }
        carregarPerfil();
    }, [userId]);

    const carregarPerfil = async () => {
        try {
            const res = await backendApi.get(`/perfil/${userId}`);
            if (res.data) {
                setPerfil(res.data);
            } else {
                setNotFound(true);
            }
        } catch (e) {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="pamigo-page">
                <div className="pamigo-loading">Carregando perfil...</div>
            </div>
        );
    }

    if (notFound || !perfil) {
        return (
            <div className="pamigo-page">
                <div className="pamigo-container">
                    <div className="pamigo-not-found">
                        <span>👤</span>
                        <h2>Perfil não encontrado</h2>
                        <p>Este usuário ainda não configurou seu perfil.</p>
                        <button className="pamigo-btn-voltar" onClick={() => navigate('/Amizades')}>
                            ← Voltar para Amizades
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const inicial = perfil.usuario?.username?.charAt(0).toUpperCase() || '?';

    return (
        <div className="pamigo-page">
            <div className="pamigo-container">

                {/* Cabeçalho do perfil */}
                <div className="pamigo-header">
                    <div className="pamigo-avatar">
                        {perfil.fotoBase64
                            ? <img src={perfil.fotoBase64} alt="Foto de perfil" />
                            : <span>{inicial}</span>
                        }
                    </div>
                    <div className="pamigo-header-info">
                        <h1 className="pamigo-nome">{perfil.usuario?.full_name}</h1>
                        <p className="pamigo-username">@{perfil.usuario?.username}</p>
                        {perfil.idade && <p className="pamigo-idade">🎂 {perfil.idade} anos</p>}
                    </div>
                </div>

                {/* Bio */}
                {perfil.bio && (
                    <div className="pamigo-section">
                        <h2>Bio</h2>
                        <p className="pamigo-bio">{perfil.bio}</p>
                    </div>
                )}

                {/* Gêneros */}
                {perfil.generos && perfil.generos.length > 0 && (
                    <div className="pamigo-section">
                        <h2>Gêneros Favoritos</h2>
                        <div className="pamigo-generos">
                            {perfil.generos.map(g => (
                                <span key={g.id} className="pamigo-genero-tag">{g.genero}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filmes Favoritos */}
                {perfil.filmesFavoritos && perfil.filmesFavoritos.length > 0 && (
                    <div className="pamigo-section">
                        <h2>Filmes Favoritos</h2>
                        <div className="pamigo-filmes">
                            {perfil.filmesFavoritos.map(f => (
                                <Link to={`/Filmee/${f.movieId}`} key={f.id} className="pamigo-filme-tag">
                                    🎬 {f.movieTitle}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pamigo-footer">
                    <button className="pamigo-btn-voltar" onClick={() => navigate('/Amizades')}>
                        ← Voltar para Amizades
                    </button>
                </div>
            </div>
        </div>
    );
}
