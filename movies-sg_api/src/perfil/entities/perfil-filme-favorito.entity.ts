import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PerfilUsuario } from "./perfil-usuario.entity";

@Entity({ name: 'perfil_filmes_favoritos' })
export class PerfilFilmeFavorito {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'perfil_id' })
    perfilId: number;

    @Column({ name: 'movie_id' })
    movieId: number;

    @Column({ name: 'movie_title', length: 255 })
    movieTitle: string;

    @Column({ name: 'movie_poster', type: 'text', nullable: true })
    moviePoster: string;

    @ManyToOne(() => PerfilUsuario, (perfil) => perfil.filmesFavoritos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'perfil_id' })
    perfil: PerfilUsuario;
}
