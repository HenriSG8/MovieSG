import { BrowserRouter,Routes , Route } from "react-router-dom";

import Cadastro from "./Cadastro";
import Login from "./Login";
import Home from "./Home";
import Navbar from "./Navbar";
import Favoritos from "./Favoritos";
import Filmee from "./Filmee";
import Pesquisa from "./Pesquisa";

import Amizades from "./Amizades";

export default function RoutesApp(){

return(


<BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/Filmee/:id" element={<Filmee />} />
        <Route path="/" element={<Home />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Cadastro" element={<Cadastro />} />
        <Route path="/Favoritos" element={<Favoritos />} />
        <Route path="/Amizades" element={<Amizades />} />
        <Route path="/Pesquisar/:query" element={<Pesquisa />} />
      </Routes>
    </BrowserRouter>




)







}