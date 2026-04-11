import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { User } from "../../user/entities/user.entity";

@Entity({ name: 'avaliacoes' })
@Index(['usuarioId', 'filmeId'], { unique: true })
export class Rating {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'usuario_id' })
    usuarioId: number;

    @Column({ name: 'filme_id' })
    filmeId: number;

    @Column({ name: 'nota', type: 'decimal', precision: 3, scale: 1, default: 0 })
    nota: number;

    @Column({ name: 'comentario', type: 'text', nullable: true })
    comentario: string;

    @CreateDateColumn({ name: 'data_avaliacao' })
    dataAvaliacao: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'usuario_id' })
    user: User;
}
