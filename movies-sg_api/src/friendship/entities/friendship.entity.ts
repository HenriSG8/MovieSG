import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum FriendshipStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED'
}

@Entity({ name: 'amizades' })
export class Friendship {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'requester_id' })
    requesterId: number;

    @Column({ name: 'addressee_id' })
    addresseeId: number;

    @Column({ type: 'varchar', default: FriendshipStatus.PENDING })
    status: FriendshipStatus;

    @CreateDateColumn({ name: 'criado_em' })
    criado_em: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'requester_id' })
    requester: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'addressee_id' })
    addressee: User;
}
