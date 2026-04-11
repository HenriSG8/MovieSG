import { useEffect, useState } from 'react';
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
        const cookieData = cookies.get('accessToken');
        if (cookieData && cookieData.id) {
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

    loadFilme();
    loadUserRating();
    loadRatingSummary();

    return() =>{
      console.log("COMPONENTE FOI DESMONTADO")
    }

  },[navigate,id])


  async function handleSaveRating() {
    const cookieData = cookies.get('accessToken');
    if (!cookieData || !cookieData.id) {
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
      
      // Refresh summary
      const response = await backendApi.get(`/ratings/summary/${id}`);
      if (response.data) {
        setRatingSummary(response.data);
      }
    } catch (error) {
      toast.error("Erro ao salvar avaliação.");
      console.error(error);
    }
  }

  function salvarFilme (){
    const cookieData = cookies.get('accessToken');
    if (!cookieData || !cookieData.id) {
      toast.error("Você precisa estar logado para favoritar um filme!");
      return;
    }

    const minhaLista = localStorage.getItem("@movieSG");
    let filmeSalvos = JSON.parse(minhaLista) || [];
    const hasFilme = filmeSalvos.some( (filmeSalvo) => filmeSalvo.id === filme.id)

    if(hasFilme){
      toast.warn("O FILME JÁ ESTA SALVO")
      return;
    }

    filmeSalvos.push(filme);
    localStorage.setItem("@movieSG", JSON.stringify(filmeSalvos));
    toast.success("FILME SALVO COM SUCESSO!")
  }

  if(loading){
    return(
      <div className='filme-info' >
        <h1> carregando detalhes... </h1>
      </div>
    )
  }

    return (
      <div className='filme-details-container' style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original/${filme.backdrop_path})` }}>
        <button className='back-btn' onClick={() => navigate(-1)}>
          &#8592; Voltar
        </button>
        <div className='filme-info-wrapper'>
          <div className='poster-side'>
            <img src={`https://image.tmdb.org/t/p/w500/${filme.poster_path}`} alt={filme.title} />
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
              <button onClick={salvarFilme} className='bnt2'> Salvar </button>
              <button className='bnt3'>
                <a target='_blank' rel='noreferrer' href={`https://www.youtube.com/results?search_query=${filme.title} Trailer`}> 
                  Trailer
                </a>
              </button>
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