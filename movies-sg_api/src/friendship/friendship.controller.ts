import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { FriendshipStatus } from './entities/friendship.entity';

@Controller('friendship')
export class FriendshipController {
    constructor(private readonly friendshipService: FriendshipService) {}

    @Post('/request')
    async sendRequest(@Body() body: { requesterId: number, addresseeId: number }) {
        return this.friendshipService.sendRequest(body.requesterId, Number(body.addresseeId));
    }

    @Post('/respond')
    async respondRequest(@Body() body: { friendshipId: number, status: FriendshipStatus, userId: number }) {
        return this.friendshipService.respondRequest(body.friendshipId, body.status, body.userId);
    }

    @Get('/my-friends/:userId')
    async getMyFriends(@Param('userId', ParseIntPipe) userId: number) {
        return this.friendshipService.getUserFriendships(userId);
    }
}
