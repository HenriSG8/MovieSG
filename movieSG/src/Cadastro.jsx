import { useState } from "react";
import axios from 'axios';
import {Link} from 'react-router-dom'
import DOMPurify from 'dompurify';

export default function Cadastro(){

    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('');
    
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
            const response = await axios.post('http://localhost:3001/user/registerUser', payload, {
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            if (response.status === 201) { 
                window.location.reload();
            } else {
                setMessage('Failed to register the story');
            }
        } catch (error) {
            setMessage(error.message)
        }
    }
    
    return (
        <div className="Login_mainDiv">
            <div id="wrapper">
                <h1 id="LoginFormTitle">Cadastre-se</h1>
                <form className="form" onSubmit={handleSubmit}>
                    <input
                        className="login_inputField"
                        type="email"
                        placeholder="E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ marginBottom: '15px' }}
                    />
                    <input
                        className="login_inputField"
                        type="text"
                        placeholder="Nome Completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={{ marginBottom: '15px' }}
                    />
                    <input
                        className="login_inputField"
                        type="text"
                        placeholder="Usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ marginBottom: '15px' }}
                    />
                    <input
                        className="login_inputField"
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ marginBottom: '20px' }}
                    />
                    <button type="submit" id="submitBtn">Registrar</button>
                </form>
                {message && <p className="alert alert-info">{message}</p>}
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <Link className="nav-link" to="/Login" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                        Já possui uma conta? Faça login
                    </Link>
                </div>
            </div>
        </div>
    );
}

