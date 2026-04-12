import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'universal-cookie';
import backendApi from './services/backendApi';
import { toast } from 'react-toastify';
import './css/Perfil.css';

const GENEROS = ['Ação', 'Aventura', 'Animação', 'Comédia', 'Crime', 'Documentário', 'Drama', 'Fantasia', 'Ficção Científica', 'Horror', 'Musical', 'Romance', 'Suspense', 'Terror', 'Western'];

export default function Perfil() {
    const navigate = useNavigate();
    const cookies = new Cookies();
    const user = cookies.get('accessToken');
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewFoto, setPreviewFoto] = useState(null);
    const [fotoBase64, setFotoBase64] = useState('');
    const [idade, setIdade] = useState('');
    const [bio, setBio] = useState('');
    const [generosSelecionados, setGenerosSelecionados] = useState([]);
    const [filmeInput, setFilmeInput] = useState('');
    const [filmesFavoritos, setFilmesFavoritos] = useState([]);

    useEffect(() => {
        if (!user) {
            navigate('/Login');
            return;
        }
        carregarPerfil();
    }, []);

    const carregarPerfil = async () => {
        try {
            const res = await backendApi.get(`/perfil/${user.id}`);
            if (res.data) {
                const p = res.data;
                if (p.fotoBase64) setPreviewFoto(p.fotoBase64);
                if (p.fotoBase64) setFotoBase64(p.fotoBase64);
                if (p.idade) setIdade(p.idade);
                if (p.bio) setBio(p.bio);
                if (p.generos) setGenerosSelecionados(p.generos.map(g => g.genero));
                if (p.filmesFavoritos) setFilmesFavoritos(p.filmesFavoritos.map(f => ({ movieId: f.movieId, movieTitle: f.movieTitle, moviePoster: f.moviePoster })));
            }
        } catch (e) {
            // Perfil ainda não existe, tudo bem
        } finally {
            setLoading(false);
        }
    };

    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('A imagem deve ter no máximo 2MB!');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 400;
                let w = img.width, h = img.height;
                if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
                else { if (h > MAX) { w = w * MAX / h; h = MAX; } }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                const base64 = canvas.toDataURL('image/jpeg', 0.8);
                setFotoBase64(base64);
                setPreviewFoto(base64);
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };

    const toggleGenero = (genero) => {
        setGenerosSelecionados(prev =>
            prev.includes(genero) ? prev.filter(g => g !== genero) : [...prev, genero]
        );
    };

    const adicionarFilme = () => {
        if (!filmeInput.trim()) return;
        setFilmesFavoritos(prev => [...prev, { movieId: Date.now(), movieTitle: filmeInput.trim(), moviePoster: '' }]);
        setFilmeInput('');
    };

    const removerFilme = (movieId) => {
        setFilmesFavoritos(prev => prev.filter(f => f.movieId !== movieId));
    };

    const salvarPerfil = async () => {
        setSaving(true);
        try {
            await backendApi.post('/perfil', {
                usuarioId: user.id,
                fotoBase64,
                idade: idade ? Number(idade) : null,
                bio,
                generos: generosSelecionados,
                filmesFavoritos,
            });
            toast.success('Perfil salvo com sucesso!');
            navigate('/');
        } catch (e) {
            toast.error('Erro ao salvar perfil.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="perfil-loading">Carregando perfil...</div>;

    return (
        <div className="perfil-page">
            <div className="perfil-container">
                <h1 className="perfil-title">✏️ Meu Perfil</h1>

                {/* Foto */}
                <div className="perfil-section">
                    <h2>Foto de Perfil</h2>
                    <div className="foto-area" onClick={() => fileInputRef.current.click()}>
                        {previewFoto
                            ? <img src={previewFoto} alt="Foto de perfil" className="foto-preview" />
                            : <div className="foto-placeholder">📷<br />Clique para selecionar</div>
                        }
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} style={{ display: 'none' }} />
                    {previewFoto && (
                        <button className="btn-remover-foto" onClick={() => { setPreviewFoto(null); setFotoBase64(''); }}>
                            Remover foto
                        </button>
                    )}
                </div>

                {/* Idade e Bio */}
                <div className="perfil-section">
                    <h2>Sobre Você</h2>
                    <label>Idade</label>
                    <input
                        type="number" className="perfil-input" placeholder="Sua idade"
                        value={idade} onChange={e => setIdade(e.target.value)} min={1} max={120}
                    />
                    <label>Bio</label>
                    <textarea
                        className="perfil-textarea" placeholder="Fale um pouco sobre você..."
                        value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={300}
                    />
                </div>

                {/* Gêneros */}
                <div className="perfil-section">
                    <h2>Gêneros Favoritos</h2>
                    <div className="generos-grid">
                        {GENEROS.map(g => (
                            <button
                                key={g}
                                className={`genero-tag ${generosSelecionados.includes(g) ? 'selected' : ''}`}
                                onClick={() => toggleGenero(g)}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filmes Favoritos */}
                <div className="perfil-section">
                    <h2>Filmes Favoritos</h2>
                    <div className="filme-input-row">
                        <input
                            type="text" className="perfil-input" placeholder="Digite o nome do filme..."
                            value={filmeInput} onChange={e => setFilmeInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && adicionarFilme()}
                        />
                        <button className="btn-add-filme" onClick={adicionarFilme}>Adicionar</button>
                    </div>
                    <div className="filmes-lista">
                        {filmesFavoritos.map(f => (
                            <div key={f.movieId} className="filme-tag">
                                🎬 {f.movieTitle}
                                <button onClick={() => removerFilme(f.movieId)}>✕</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ações */}
                <div className="perfil-actions">
                    <button className="btn-cancelar" onClick={() => navigate('/')}>Cancelar</button>
                    <button className="btn-salvar" onClick={salvarPerfil} disabled={saving}>
                        {saving ? 'Salvando...' : '💾 Salvar Perfil'}
                    </button>
                </div>
            </div>
        </div>
    );
}
