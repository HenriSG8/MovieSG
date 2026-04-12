import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PerfilUsuario } from "./perfil-usuario.entity";

@Entity({ name: 'perfil_generos' })
export class PerfilGenero {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'perfil_id' })
    perfilId: number;

    @Column({ length: 100 })
    genero: string;

    @ManyToOne(() => PerfilUsuario, (perfil) => perfil.generos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'perfil_id' })
    perfil: PerfilUsuario;
}
