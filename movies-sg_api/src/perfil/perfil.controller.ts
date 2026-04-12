import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { PerfilService } from './perfil.service';

@Controller('perfil')
export class PerfilController {
    constructor(private readonly perfilService: PerfilService) {}

    @Post()
    async savePerfil(@Body() body: any) {
        return this.perfilService.savePerfil(body);
    }

    @Get(':userId')
    async getPerfil(@Param('userId', ParseIntPipe) userId: number) {
        return this.perfilService.getPerfil(userId);
    }
}
