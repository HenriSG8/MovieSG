import { IsOptional, IsString } from "class-validator";

export class UserDto {

    @IsString()
    full_name: string;

    @IsString()
    username: string;

    @IsString()
    email: string;

    @IsString()
    password: string;

    @IsString()
    @IsOptional()
    userToken?: string;

}