import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'usuarios' })
export class User {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'nome_completo' })
    full_name: string;

    @Column({ name: 'usuario', unique: true })
    username: string;

    @Column({ name: 'email', unique: true })
    email: string;

    @Column({ name: 'senha' })
    password: string;

    @Column({ name: 'userToken', nullable: true })
    userToken: string;

    @CreateDateColumn({ name: 'data_criacao' })
    data_criacao: Date;
}