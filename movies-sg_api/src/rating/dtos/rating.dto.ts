import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class RatingDto {
    @IsNotEmpty()
    @IsNumber()
    userId: number;

    @IsNotEmpty()
    @IsNumber()
    movieId: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @Max(10)
    score: number;

    @IsOptional()
    @IsString()
    comment: string;
}
