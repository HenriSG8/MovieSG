import { useState } from "react";
import backendApi from './services/backendApi';
import { Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import './css/Login.css'; // Reutiliza os estilos premium

export default function Cadastro(){
    const navigate = useNavigate();

    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        const cleanedEmail  = DOMPurify.sanitize(email);
        const cleanedFullname  = DOMPurify.sanitize(fullName);
        const cleanedUsername  = DOMPurify.sanitize(username);

        const payload = {
            email: cleanedEmail,
            full_name: cleanedFullname,
            username: cleanedUsername,
            password: password
        };

        try {
            const response = await backendApi.post('/user/registerUser', payload, {
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            if (response.status === 201) { 
                setShowModal(true); // Exibe o modal ao invés de recarregar
            } else {
                setMessage('Failed to register the story');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Erro ao realizar cadastro. Tente novamente.';
            setMessage(errorMsg);
        }
    }
    
    return (
        <div className="Login_mainDiv">
            <div id="wrapper">
                <h1 id="LoginFormTitle">Cadastre-se</h1>
                <form className="form" onSubmit={handleSubmit}>
                    <div className="login_input_group">
                        <input
                            className="login_inputField"
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="login_input_group">
                        <input
                            className="login_inputField"
                            type="text"
                            placeholder="Nome Completo"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <div className="login_input_group">
                        <input
                            className="login_inputField"
                            type="text"
                            placeholder="Usuário"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="login_input_group">
                        <input
                            className="login_inputField"
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" id="submitBtn">Criar Conta</button>
                </form>
                {message && <p className="alert alert-info">{message}</p>}
                
                <div className="login-footer">
                    Já possui uma conta? 
                    <Link to="/Login">Faça login</Link>
                </div>
            </div>

            {/* Modal pós-cadastro */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div className="modal-icon">🎉</div>
                        <h2>Conta criada com sucesso!</h2>
                        <p>Deseja configurar o seu perfil agora?<br/>
                        <small>Você pode adicionar foto, gêneros favoritos e muito mais!</small></p>
                        <div className="modal-actions">
                            <button className="modal-btn-secondary" onClick={() => navigate('/Login')}>
                                Agora não
                            </button>
                            <button className="modal-btn-primary" onClick={() => navigate('/Login')}>
                                {/* Usuário precisa logar primeiro para ter o cookie, aí vai ao perfil */}
                                Ir para Login
                            </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '8px' }}>
                            💡 Após o login, acesse seu perfil pelo menu no topo!
                        </p>
                    </div>
                </div>
            )}

            <style>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.75);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.2s ease;
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .modal-box {
                    background: #1a1a2e;
                    border-radius: 16px;
                    padding: 40px 36px;
                    max-width: 420px;
                    width: 90%;
                    text-align: center;
                    border: 1px solid rgba(229,9,20,0.3);
                    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
                    animation: slideUp 0.3s ease;
                }
                @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .modal-icon { font-size: 3rem; margin-bottom: 12px; }
                .modal-box h2 { font-size: 1.4rem; color: #eee; margin-bottom: 12px; }
                .modal-box p { color: #bbb; font-size: 0.95rem; line-height: 1.6; }
                .modal-box small { color: #888; font-size: 0.82rem; }
                .modal-actions { display: flex; gap: 12px; justify-content: center; margin-top: 24px; }
                .modal-btn-secondary {
                    padding: 10px 24px; background: transparent;
                    border: 1px solid rgba(255,255,255,0.2); color: #ccc;
                    border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;
                }
                .modal-btn-secondary:hover { border-color: #e50914; color: #e50914; }
                .modal-btn-primary {
                    padding: 10px 24px;
                    background: linear-gradient(135deg, #e50914, #ff6b35);
                    color: white; border: none; border-radius: 8px;
                    cursor: pointer; font-size: 0.9rem; font-weight: 700; transition: opacity 0.2s;
                }
                .modal-btn-primary:hover { opacity: 0.9; }
            `}</style>
        </div>
    );
}
