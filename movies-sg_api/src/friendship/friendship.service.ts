import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friendship, FriendshipStatus } from './entities/friendship.entity';

@Injectable()
export class FriendshipService {
    constructor(
        @InjectRepository(Friendship)
        private friendshipRepository: Repository<Friendship>
    ) {}

    async sendRequest(requesterId: number, addresseeId: number): Promise<Friendship> {
        if (requesterId === addresseeId) {
            throw new BadRequestException('Você não pode enviar um pedido de amizade para si mesmo');
        }

        const existing = await this.friendshipRepository.findOne({
            where: [
                { requesterId, addresseeId },
                { requesterId: addresseeId, addresseeId: requesterId }
            ]
        });

        if (existing) {
            throw new BadRequestException('Esta amizade ou pedido já existe');
        }

        const friendship = this.friendshipRepository.create({
            requesterId,
            addresseeId,
            status: FriendshipStatus.PENDING
        });

        return this.friendshipRepository.save(friendship);
    }

    async respondRequest(friendshipId: number, status: FriendshipStatus, userId: number): Promise<Friendship> {
        const friendship = await this.friendshipRepository.findOne({ where: { id: friendshipId }});
        
        if (!friendship) {
            throw new NotFoundException('Pedido de amizade não encontrado');
        }

        if (friendship.addresseeId !== userId) {
            throw new BadRequestException('Você só pode responder a pedidos enviados para você');
        }

        friendship.status = status;
        return this.friendshipRepository.save(friendship);
    }

    async getUserFriendships(userId: number): Promise<any> {
        const friendships = await this.friendshipRepository.find({
            where: [
                { requesterId: userId },
                { addresseeId: userId }
            ],
            relations: ['requester', 'addressee']
        });

        const pendingReceived = friendships.filter(f => f.status === FriendshipStatus.PENDING && f.addresseeId === userId);
        const pendingSent = friendships.filter(f => f.status === FriendshipStatus.PENDING && f.requesterId === userId);
        const accepted = friendships.filter(f => f.status === FriendshipStatus.ACCEPTED);

        // Map to return clean user objects
        const formatFriend = (f, isRequester) => {
            // Se isRequester for true, significa que o usuario atual é o requester = quem a gente quer ver é o addressee. Wait, no.
            // if we are looking at pendingReceived (we are addressee), the other person is requester.
            const user = isRequester ? f.requester : f.addressee;
            return {
                friendshipId: f.id,
                userId: user.id,
                username: user.username,
                full_name: user.full_name
            };
        };

        return {
            pendingReceived: pendingReceived.map(f => formatFriend(f, true)),
            pendingSent: pendingSent.map(f => formatFriend(f, false)),
            friends: accepted.map(f => formatFriend(f, f.addresseeId === userId))
        };
    }
}
