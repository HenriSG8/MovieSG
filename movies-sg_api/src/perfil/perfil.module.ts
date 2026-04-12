import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilUsuario } from './entities/perfil-usuario.entity';
import { PerfilGenero } from './entities/perfil-genero.entity';
import { PerfilFilmeFavorito } from './entities/perfil-filme-favorito.entity';
import { PerfilService } from './perfil.service';
import { PerfilController } from './perfil.controller';

@Module({
    imports: [TypeOrmModule.forFeature([PerfilUsuario, PerfilGenero, PerfilFilmeFavorito])],
    controllers: [PerfilController],
    providers: [PerfilService],
})
export class PerfilModule {}
