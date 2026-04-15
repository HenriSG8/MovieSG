import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingModule } from './rating/rating.module';
import { FriendshipModule } from './friendship/friendship.module';
import { PerfilModule } from './perfil/perfil.module';
import { TorrentModule } from './torrent/torrent.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      database: process.env.DB_DATABASE,
      host: process.env.DB_HOST,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME,
      entities: [`${__dirname}/**/*.entity{.js,.ts}`],
      migrations: [`${__dirname}/migration/{*.js,.ts}`],
      migrationsRun: true,
      synchronize: true,
    }),
    UserModule,
    RatingModule,
    FriendshipModule,
    PerfilModule,
    TorrentModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule {}