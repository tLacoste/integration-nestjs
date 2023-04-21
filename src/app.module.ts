import { Module } from '@nestjs/common';
import { UserService } from './user/user.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserResolver } from './user/user.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user/user.entity';
import { config } from 'dotenv';
import { EmailResolver } from './email/email.resolver';
import { EmailEntity } from './email/email.entity';

config({});

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: +process.env.POSTGRES_PORT,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PW,
      database: process.env.POSTGRES_DB,
      entities: [UserEntity, EmailEntity],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([UserEntity, EmailEntity]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
  ],
  providers: [UserResolver, EmailResolver, UserService],
})
export class AppModule {}
