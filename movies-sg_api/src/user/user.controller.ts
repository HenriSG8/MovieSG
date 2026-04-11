import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res, UnauthorizedException, UseGuards, HttpException } from '@nestjs/common';
import { UserService } from "./user.service";
import { User } from "./entities/user.entity";
import { UserDto } from "./dtos/user.dto";
import { Request, Response } from 'express';
import { SignInDto } from './dtos/signIn.dto';

@Controller('user')
export class UserController {

    constructor(private readonly userService: UserService){}
    
    @Post('/registerUser')
    async registerUser(@Body() userDto: UserDto): Promise<User> {
        try {
            return this.userService.registerUser(userDto);
            
        } catch (error) {
            throw new HttpException('Error in user register', HttpStatus.BAD_REQUEST)
        }
    }

    @Post('/signIn')
    @HttpCode(HttpStatus.OK)
    async signIn(@Body() signInDto: SignInDto, @Res() res: Response): Promise<void> {
        try {
            // Attempt to sign in the user and get a token
            const token = await this.userService.signIn(signInDto.email, signInDto.password);
            if (!token) {
                throw new UnauthorizedException('Invalid credentials');
            }

            // Retrieve user information
            const user = await this.userService.findOne(signInDto.email);

            // Set cookies for user data
            const maxAgeInMilliseconds = 3600000;
            res.cookie('email', user.email, {
                httpOnly: true,
                maxAge: maxAgeInMilliseconds,
            });
            res.cookie('id', user.id, {
                httpOnly: true,
                maxAge: maxAgeInMilliseconds,
            });
            // Respond with token and user data
            res.json({ access_token: token, username: user.username, id: user.id });
        } catch (error) {
            // Handle any errors that occur during login
            res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Not Authorized' });
        }
    }
}