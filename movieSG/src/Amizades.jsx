import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'universal-cookie';
import backendApi from './services/backendApi';
import './css/Amizades.css';
import { toast } from 'react-toastify';

export default function Amizades() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    
    const [friends, setFriends] = useState([]);
    const [pendingReceived, setPendingReceived] = useState([]);
    const [pendingSent, setPendingSent] = useState([]);

    const navigate = useNavigate();
    const cookies = new Cookies();
    const user = cookies.get('accessToken');

    useEffect(() => {
        if (!user) {
            navigate('/Login');
            return;
        }
        loadFriendships();
    }, [user, navigate]);

    const loadFriendships = async () => {
        try {
            const response = await backendApi.get(`/friendship/my-friends/${user.id}`);
            setFriends(response.data.friends);
            setPendingReceived(response.data.pendingReceived);
            setPendingSent(response.data.pendingSent);
        } catch (error) {
            console.error("Erro ao carregar amizades", error);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            const response = await backendApi.get(`/user/search/${searchQuery}`);
            setSearchResults(response.data);
        } catch (error) {
            toast.error("Erro ao buscar usuários");
        }
    };

    const addFriend = async (addresseeId) => {
        try {
            await backendApi.post('/friendship/request', {
                requesterId: user.id,
                addresseeId: addresseeId
            });
            toast.success("Solicitação enviada!");
            loadFriendships();
        } catch (error) {
            const msg = error.response?.data?.message || "Erro de conexão com o servidor. Tente novamente.";
            toast.error(msg);
        }
    };

    const respondRequest = async (friendshipId, status) => {
        try {
            await backendApi.post('/friendship/respond', {
                friendshipId,
                status,
                userId: user.id
            });
            if (status === 'ACCEPTED') toast.success("Amizade aceita!");
            if (status === 'REJECTED') toast.info("Solicitação recusada.");
            loadFriendships();
        } catch (error) {
            const msg = error.response?.data?.message || "Erro de conexão com o servidor. Tente novamente.";
            toast.error(msg);
        }
    };

    return (
        <div className="amizades-container">
            <button className="btn-voltar-topo" onClick={() => navigate('/')}>← Voltar</button>
            <h1 className="amizades-title">Suas Amizades</h1>

            <div className="search-users-section">
                <h2>Buscar Novos Amigos</h2>
                <form onSubmit={handleSearch} className="friend-search-form">
                    <input 
                        type="text" 
                        placeholder="Busque pelo usuário..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <button type="submit">Buscar</button>
                </form>

                {searchResults.length > 0 && (
                    <div className="search-results">
                        {searchResults.map(resultuser => (
                            resultuser.id !== user.id && (
                                <div key={resultuser.id} className="friend-card">
                                    <div className="friend-info">
                                        <div className="friend-avatar">{resultuser.username.charAt(0).toUpperCase()}</div>
                                        <div>
                                            <p className="friend-name">{resultuser.full_name}</p>
                                            <p className="friend-username">@{resultuser.username}</p>
                                        </div>
                                    </div>
                                    {friends.some(f => f.userId === resultuser.id) ? (
                                        <button 
                                            className="add-friend-btn ver-perfil-btn" 
                                            onClick={() => navigate(`/PerfilAmigo/${resultuser.id}`)}
                                        >
                                            Ver Perfil
                                        </button>
                                    ) : pendingSent.some(f => f.userId === resultuser.id) ? (
                                        <button className="add-friend-btn pending-btn" disabled>
                                            Pendente
                                        </button>
                                    ) : pendingReceived.some(f => f.userId === resultuser.id) ? (
                                        <button 
                                            className="add-friend-btn respond-btn" 
                                            onClick={() => navigate('/Amizades')} // Or just highlight the request below
                                        >
                                            Aceitar?
                                        </button>
                                    ) : (
                                        <button className="add-friend-btn" onClick={() => addFriend(resultuser.id)}>
                                            Adicionar
                                        </button>
                                    )}
                                </div>
                            )
                        ))}
                    </div>
                )}
            </div>

            {pendingReceived.length > 0 && (
                <div className="pending-section">
                    <h2>Solicitações Recebidas ({pendingReceived.length})</h2>
                    <div className="friends-list">
                        {pendingReceived.map(req => (
                            <div key={req.friendshipId} className="friend-card pending">
                                <div className="friend-info">
                                    <div className="friend-avatar">{req.username.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <p className="friend-name">{req.full_name}</p>
                                        <p className="friend-username">@{req.username}</p>
                                    </div>
                                </div>
                                <div className="action-buttons">
                                    <button className="accept-btn" onClick={() => respondRequest(req.friendshipId, 'ACCEPTED')}>Aceitar</button>
                                    <button className="reject-btn" onClick={() => respondRequest(req.friendshipId, 'REJECTED')}>Recusar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="friends-section">
                <h2>Meus Amigos ({friends.length})</h2>
                {friends.length === 0 ? (
                    <p className="empty-msg">Você ainda não possui amigos adicionados.</p>
                ) : (
                    <div className="friends-list">
                        {friends.map(friend => (
                            <div key={friend.userId} className="friend-card">
                                <div className="friend-info">
                                    <div className="friend-avatar">{friend.username.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <p className="friend-name">{friend.full_name}</p>
                                        <p className="friend-username">@{friend.username}</p>
                                    </div>
                                </div>
                                <button
                                    className="add-friend-btn"
                                    onClick={() => navigate(`/PerfilAmigo/${friend.userId}`)}
                                >
                                    Ver Perfil
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
