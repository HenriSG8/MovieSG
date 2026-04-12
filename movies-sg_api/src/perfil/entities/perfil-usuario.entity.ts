import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "src/user/entities/user.entity";
import { PerfilGenero } from "./perfil-genero.entity";
import { PerfilFilmeFavorito } from "./perfil-filme-favorito.entity";

@Entity({ name: 'perfil_usuario' })
export class PerfilUsuario {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'usuario_id', unique: true })
    usuarioId: number;

    @Column({ name: 'foto_base64', type: 'text', nullable: true })
    fotoBase64: string;

    @Column({ nullable: true })
    idade: number;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @CreateDateColumn({ name: 'criado_em' })
    criadoEm: Date;

    @UpdateDateColumn({ name: 'atualizado_em' })
    atualizadoEm: Date;

    @OneToOne(() => User)
    @JoinColumn({ name: 'usuario_id' })
    usuario: User;

    @OneToMany(() => PerfilGenero, (genero) => genero.perfil, { cascade: true, eager: true })
    generos: PerfilGenero[];

    @OneToMany(() => PerfilFilmeFavorito, (filme) => filme.perfil, { cascade: true, eager: true })
    filmesFavoritos: PerfilFilmeFavorito[];
}
