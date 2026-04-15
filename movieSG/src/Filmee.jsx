import { useEffect, useState, useCallback } from 'react';
import {  useParams , useNavigate   } from 'react-router-dom'
import api from "./services/api";
import backendApi from "./services/backendApi";
import '../src/css/filmee-info.css'
import { toast } from 'react-toastify'
import Cookies from 'universal-cookie';

function Filmee() {
    const {id} = useParams();
    const navigate = useNavigate()
    const cookies = new Cookies();
    
    const[ filme , setfilme] = useState({});
    const[ loading , setloading] = useState(true);
    const[ userScore, setUserScore] = useState(0);
    const[ userComment, setUserComment] = useState('');
    const[ ratingSummary, setRatingSummary] = useState({ average: 0, count: 0 });
    const[ imdbId, setImdbId] = useState(null);
    const[ torrents, setTorrents] = useState([]);
    const[ loadingTorrents, setLoadingTorrents] = useState(false);
    const[ isSaved, setIsSaved] = useState(false);

    const cookieData = cookies.get('accessToken');
    const isLoggedIn = cookieData && cookieData.id;

    const checkIsSaved = useCallback(async () => {
      if (isLoggedIn && id) {
        try {
          const res = await backendApi.get(`/saved-movies/check/${cookieData.id}/${id}`);
          setIsSaved(res.data.favorited);
        } catch (e) {
          console.error("Erro ao checar se filme está salvo:", e);
        }
      }
    }, [isLoggedIn, id, cookieData?.id]);
  
    useEffect(()=>{
    async function loadFilme(){
      await api.get(`/movie/${id}`,{
        params:{
          api_key: "7fbee966dcca15e34a84ff539e33c11b",
          language: "pt-BR",
        }
      })
      .then((response) => {
        setfilme(response.data);
        setloading(false);
      })
      .catch(() => {
        console.log("fime n escontrado")
        navigate("/",{replace:true})
        return;
      })
    }

    async function loadUserRating() {
        if (isLoggedIn) {
            try {
                const response = await backendApi.get(`/ratings/${id}`, {
                    params: { userId: cookieData.id }
                });
                if (response.data) {
                    setUserScore(response.data.nota || 0);
                    setUserComment(response.data.comentario || '');
                }
            } catch (error) {
                console.error("Erro ao carregar nota:", error);
            }
        }
    }

    async function loadRatingSummary() {
      try {
        const response = await backendApi.get(`/ratings/summary/${id}`);
        if (response.data) {
          setRatingSummary(response.data);
        }
      } catch (error) {
        console.error("Erro ao carregar resumo de avaliações:", error);
      }
    }

    async function loadImdbId() {
      try {
        const response = await api.get(`/movie/${id}/external_ids`, {
          params: {
            api_key: "7fbee966dcca15e34a84ff539e33c11b",
          }
        });
        if (response.data && response.data.imdb_id) {
          setImdbId(response.data.imdb_id);
        }
      } catch (error) {
        console.error("Erro ao buscar IMDb ID:", error);
      }
    }

    loadFilme();
    loadUserRating();
    loadRatingSummary();
    loadImdbId();
    checkIsSaved();

  },[navigate,id, isLoggedIn, checkIsSaved])

  // Busca os Torrents assim que o imdbId estiver disponível
  useEffect(() => {
    if (imdbId) {
      async function fetchTorrents() {
        setLoadingTorrents(true);
        try {
          const res = await backendApi.get(`/torrent/search/${imdbId}`);
          if (res.data && res.data.torrents) {
            setTorrents(res.data.torrents);
          }
        } catch (err) {
          console.error('Erro ao buscar torrents:', err);
        } finally {
          setLoadingTorrents(false);
        }
      }
      fetchTorrents();
    }
  }, [imdbId]);


  async function handleSaveRating() {
    if (!isLoggedIn) {
      toast.error("Você precisa estar logado para avaliar!");
      return;
    }

    const score = Number(userScore);
    if (score < 1 || score > 10) {
      toast.error("A nota deve ser entre 1 e 10!");
      return;
    }

    try {
      await backendApi.post('/ratings', {
        userId: cookieData.id,
        movieId: Number(id),
        score: score,
        comment: userComment
      });
      toast.success("Avaliação salva com sucesso!");
      loadRatingSummary();
    } catch (error) {
      const msg = error.response?.data?.message || "Erro de conexão com o servidor. Tente novamente.";
      toast.error(msg);
    }
  }

  async function toggleSalvarFilme (){
    if (!isLoggedIn) {
      toast.error("Você precisa estar logado para salvar um filme!");
      return;
    }

    try {
      if (isSaved) {
        // Remover
        await backendApi.delete(`/saved-movies/${cookieData.id}/${id}`);
        setIsSaved(false);
        toast.info("Filme removido da sua lista.");
      } else {
        // Salvar
        await backendApi.post('/saved-movies', {
          userId: cookieData.id,
          movieId: Number(id),
          movieTitle: filme.title,
          moviePoster: filme.poster_path
        });
        setIsSaved(true);
        toast.success("Filme salvo com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar/remover filme:", error);
      toast.error("Erro na comunicação com o servidor.");
    }
  }

  const getQualityClass = (quality) => {
    if (quality.includes('2160')) return 'q-2160p';
    if (quality.includes('1080')) return 'q-1080p';
    if (quality.includes('720')) return 'q-720p';
    return '';
  };

  if(loading){
    return(
      <div className='filme-info' >
        <h1> carregando detalhes... </h1>
      </div>
    )
  }

    return (
      <div className='filme-details-container' style={{ 
        backgroundImage: filme.backdrop_path 
          ? `url(https://image.tmdb.org/t/p/original/${filme.backdrop_path})` 
          : `linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.9)), url('https://via.placeholder.com/1920x1080?text=Imagem+Indispon%C3%ADvel')`
      }}>
        <button className='back-btn' onClick={() => navigate(-1)}>
          &#8592; Voltar
        </button>
        <div className='filme-info-wrapper'>
          <div className='poster-side'>
            <img 
              src={filme.poster_path 
                ? `https://image.tmdb.org/t/p/w500/${filme.poster_path}` 
                : 'https://via.placeholder.com/500x750?text=Imagem+Indispon%C3%ADvel'
              } 
              alt={filme.title} 
            />
          </div>
          
          <div className='info-side'>
            <h1 className='titlei'> {filme.title} </h1>
            
            <div className='ratings-container-flex'>
              <div className='rating-badge site-rating'>
                <span>TMDB:</span> {filme.vote_average.toFixed(1)} / 10
              </div>
              <div className='rating-badge community-rating'>
                <span>Comunidade:</span> {ratingSummary.average.toFixed(1)} / 10 
                <small>({ratingSummary.count} {ratingSummary.count === 1 ? 'avaliação' : 'avaliações'})</small>
              </div>
            </div>
            
            <h3 className='sinopse-title'> Sinopse </h3>
            <span className='sinopse-text'> {filme.overview} </span>

            <div className='area-buttons'>  
              <button 
                onClick={toggleSalvarFilme} 
                className={`bnt2 ${isSaved ? 'btn-saved-active' : ''}`}
                style={isSaved ? { backgroundColor: '#ff6b6b', color: '#fff' } : {}}
              > 
                {isSaved ? 'Remover dos Salvos' : 'Salvar Filme'}
              </button>
              <button className='bnt3'>
                <a target='_blank' rel='noreferrer' href={`https://www.youtube.com/results?search_query=${filme.title} Trailer`}> 
                  Trailer
                </a>
              </button>
            </div>

            {/* SEÇÃO DE MAGNET LINKS */}
            <div className='magnets-section'>
              <h3 className='magnets-title'>🧲 Downloads Disponíveis</h3>
              {loadingTorrents ? (
                <div className='loading-magnets'>
                   <span>Buscando links magnéticos...</span>
                </div>
              ) : torrents.length > 0 ? (
                <div className='magnets-list'>
                  {torrents.map((t, idx) => (
                    <div key={idx} className="magnet-row">
                      <div className="magnet-info">
                        <span className={`magnet-quality ${getQualityClass(t.quality)}`}>{t.quality}</span>
                        <span className="magnet-lang">{t.language || 'Original'}</span>
                        <span className="magnet-size">{t.size}</span>
                      </div>
                      <a href={t.magnetLink} className="magnet-download-btn">
                        <span>Baixar Magnet</span>
                        <small>📥</small>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='no-magnets'>Nenhum link de download disponível para este filme no momento.</p>
              )}
            </div>

            <div className='user-rating-section'>
              <h3 className='rating-title'>Minha Avaliação</h3>
              <div className='rating-inputs'>
                <div className='score-input-wrapper'>
                  <label>Nota (1-10):</label>
                  <input 
                    type='number' 
                    min='1' 
                    max='10' 
                    step='0.5'
                    value={userScore} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || (Number(val) >= 1 && Number(val) <= 10)) {
                        setUserScore(val);
                      }
                    }}
                  />
                </div>
                <textarea 
                  placeholder='O que você achou do filme? (Opcional)'
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                />
                <button onClick={handleSaveRating} className='save-rating-btn'>Salvar Nota</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}
  
export default Filmee;