import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { ConflictException, Inject, Injectable, InternalServerErrorException, UnauthorizedException, BadRequestException  } from "@nestjs/common";
import { UserDto } from "./dtos/user.dto";
import * as bcrypt from 'bcrypt';
import authConfig from "./auth.config";
import { InjectRepository } from "@nestjs/typeorm";
import * as jwt from 'jsonwebtoken';
@Injectable()
export class UserService {

    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>){}

    async registerUser(userDto: UserDto): Promise<User> {
        try {
            const saltOrRounds = 10;
            const passwordHashed = await bcrypt.hash(userDto.password, saltOrRounds);

            const payload = {
                email: userDto.email,
            }

            const token = jwt.sign(payload, authConfig.jwtSecret)
            return await this.userRepository.save({
                ...userDto,
                password: passwordHashed,
                userToken: token,
            })
        } catch (error) {
            if (error.code == '23505') {
                throw new ConflictException('Usuário ou e-mail já estão em uso')
            }
            throw new InternalServerErrorException('Erro ao registrar usuário')
        }
    }

    async signIn(email: string, password: string): Promise<any> {
        try {
            // Find user by username
            const user = await this.userRepository.findOne({ where: { email: email } });

            if (!user) {
                return undefined; // User not found
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Credenciais inválidas');
            }

            if(!user.userToken) {
                throw new UnauthorizedException('Token não encontrado');
            }

            return user.userToken;
        } catch (error) {
            throw new UnauthorizedException('Credenciais inválidas');
        }
    }

    async findOne(email: string): Promise<User | undefined> {
        try {
            return this.userRepository.findOne({ where: { email } });
        } catch (error) {
            throw new InternalServerErrorException('Erro ao buscar usuário pelo e-mail')
        }
    }

    async searchByUsername(query: string): Promise<User[]> {
        try {
            return this.userRepository.createQueryBuilder('user')
                .where('user.username ILIKE :query', { query: `%${query}%` })
                .select(['user.id', 'user.username', 'user.full_name'])
                .getMany();
        } catch (error) {
            throw new InternalServerErrorException('Erro ao pesquisar usuário');
        }
    }

}