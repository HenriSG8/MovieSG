import React, { useState, useEffect } from "react";
import { useNavigate , Link } from "react-router-dom";
import Cookies from 'universal-cookie';
import logo from '../public/imagem_2023-10-01_203735506-removebg-preview.png';
import "../src/css/Home.css";
import "../src/css/DarkMode.css";

const Navbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const cookies = new Cookies();
  useEffect(() => {
    const savedMode = localStorage.getItem("dark");
    if (savedMode === "dark") {
      document.body.classList.add("dark");
      setTheme("dark");
    }

    const userData = cookies.get('accessToken');
    if (userData) {
      setUser(userData);
    }
  }, []);

  const handletoggled = () => {
    const isDark = document.body.classList.contains("dark");
    if (isDark) {
      document.body.classList.remove("dark");
      localStorage.setItem("dark", "light");
      setTheme("light");
    } else {
      document.body.classList.add("dark");
      localStorage.setItem("dark", "dark");
      setTheme("dark");
    }
  };

  const handleHamburgerClick = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() === "") return;
    navigate(`/Pesquisar/${encodeURIComponent(searchQuery)}`);
    setSearchQuery("");
    setMobileMenuOpen(false); // Close mobile menu if open
  };

  const handleLogout = () => {
    cookies.remove('accessToken', { path: '/' });
    setUser(null);
    navigate('/');
    window.location.reload();
  };

  return (
    <header className="header">
      <nav className={`nav ${isMobileMenuOpen ? "active" : ""}`}>
        <a href="/" className="logo-container"> 
          <img src={logo} alt="MovieSG" className="logo-img" /> 
        </a>
        
        <form className="search-form" onSubmit={handleSearch}>
          <input 
            type="text" 
            className="search-input"
            placeholder="Buscar filmes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-button">&#128269;</button>
        </form>

        <button className="hamburger" onClick={handleHamburgerClick}>
          <span></span>
        </button>
        <ul className="nav-list">
          {!user ? (
            <>
              <li><Link to="/Login" className="nav-link">Login</Link></li>
              <li><Link to="/Cadastro" className="nav-link">Cadastro</Link></li>
            </>
          ) : (
            <li className="user-dropdown-container">
              <span className="nav-link user-name-link">Olá, {user.username}</span>
              <ul className="dropdown-menu">
                <li><Link to="/Perfil" className="dropdown-item">Meu Perfil</Link></li>
                <li><Link to="/Favoritos" className="dropdown-item">Favoritos</Link></li>
                <li><Link to="/Amizades" className="dropdown-item">Minhas Amizades</Link></li>
                <li><button onClick={handleLogout} className="dropdown-item logout-btn">Sair</button></li>
              </ul>
            </li>
          )}
          <li className="mode-toggle">
            <button className="theme-btn" onClick={handletoggled} aria-label="Alternar Tema">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
