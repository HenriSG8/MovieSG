import { useEffect, useState } from 'react';
import {  Link, useNavigate  } from 'react-router-dom'
import "../src/css/Favoritos.css"
import { toast } from 'react-toastify'
import backendApi from './services/backendApi';
import Cookies from 'universal-cookie';

function Salvos(){
    const [filmes, setfilmes] = useState([])
    const navigate = useNavigate();
    const cookies = new Cookies();
    const user = cookies.get('accessToken');

    useEffect(() => {
        async function loadSalvos() {
            const userData = cookies.get('accessToken');
            if (userData && userData.id) {
                try {
                    const response = await backendApi.get(`/saved-movies/${userData.id}`);
                    if (response.data) {
                        setfilmes(response.data);
                    }
                } catch (error) {
                    console.error("Erro ao carregar filmes salvos:", error);
                    toast.error("Erro ao carregar sua lista.");
                }
            }
        }
        loadSalvos();
    }, []);

    async function excluirFilme(movieId){
        try {
            await backendApi.delete(`/saved-movies/${user.id}/${movieId}`);
            setfilmes(filmes.filter(item => item.movieId !== movieId));
            toast.success("FILME REMOVIDO COM SUCESSO!");
        } catch (error) {
            toast.error("Erro ao remover filme.");
        }
    }

    return(
        <div className='meus-filmes' >
            <button className="btn-voltar-topo" onClick={() => navigate('/')}>← Voltar</button>
            <h1 className='titulo'> Filmes Salvos </h1> 
            <ul>
                {filmes.length === 0 && <p style={{color: '#888', textAlign: 'center'}}>Você ainda não salvou nenhum filme.</p>}
                {filmes.map((item) => {
                    return(
                        <li key={item.movieId} >
                            <img 
                                className="imgf" 
                                src={item.moviePoster ? `https://image.tmdb.org/t/p/original/${item.moviePoster}` : 'https://via.placeholder.com/500x750?text=Indispon%C3%ADvel'} 
                                alt={item.movieTitle} 
                            />
                            <span className='titlef'>{item.movieTitle} </span>
                            <div>
                                <Link className='link' to={`/Filmee/${item.movieId}`}> ver detalhe </Link>
                                <button className='bntfav' onClick={() => excluirFilme(item.movieId) }>Excluir</button>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

export default Salvos;
