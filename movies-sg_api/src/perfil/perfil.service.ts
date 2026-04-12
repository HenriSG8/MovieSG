import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilUsuario } from './entities/perfil-usuario.entity';
import { PerfilGenero } from './entities/perfil-genero.entity';
import { PerfilFilmeFavorito } from './entities/perfil-filme-favorito.entity';

export interface SavePerfilDto {
    usuarioId: number;
    fotoBase64?: string;
    idade?: number;
    bio?: string;
    generos?: string[];
    filmesFavoritos?: { movieId: number; movieTitle: string; moviePoster?: string }[];
}

@Injectable()
export class PerfilService {
    constructor(
        @InjectRepository(PerfilUsuario)
        private perfilRepo: Repository<PerfilUsuario>,
        @InjectRepository(PerfilGenero)
        private generoRepo: Repository<PerfilGenero>,
        @InjectRepository(PerfilFilmeFavorito)
        private filmeRepo: Repository<PerfilFilmeFavorito>,
    ) {}

    async savePerfil(dto: SavePerfilDto): Promise<PerfilUsuario> {
        let perfil = await this.perfilRepo.findOne({ where: { usuarioId: dto.usuarioId } });

        if (!perfil) {
            perfil = this.perfilRepo.create({ usuarioId: dto.usuarioId });
        }

        if (dto.fotoBase64 !== undefined) perfil.fotoBase64 = dto.fotoBase64;
        if (dto.idade !== undefined) perfil.idade = dto.idade;
        if (dto.bio !== undefined) perfil.bio = dto.bio;

        const saved = await this.perfilRepo.save(perfil);

        // Atualiza gêneros (remove os antigos e insere os novos)
        if (dto.generos !== undefined) {
            await this.generoRepo.delete({ perfilId: saved.id });
            if (dto.generos.length > 0) {
                const generoEntities = dto.generos.map(g =>
                    this.generoRepo.create({ perfilId: saved.id, genero: g })
                );
                await this.generoRepo.save(generoEntities);
            }
        }

        // Atualiza filmes favoritos
        if (dto.filmesFavoritos !== undefined) {
            await this.filmeRepo.delete({ perfilId: saved.id });
            if (dto.filmesFavoritos.length > 0) {
                const filmeEntities = dto.filmesFavoritos.map(f =>
                    this.filmeRepo.create({
                        perfilId: saved.id,
                        movieId: f.movieId,
                        movieTitle: f.movieTitle,
                        moviePoster: f.moviePoster,
                    })
                );
                await this.filmeRepo.save(filmeEntities);
            }
        }

        return this.getPerfil(dto.usuarioId);
    }

    async getPerfil(usuarioId: number): Promise<PerfilUsuario | null> {
        return this.perfilRepo.findOne({
            where: { usuarioId },
            relations: ['generos', 'filmesFavoritos', 'usuario'],
        });
    }
}
