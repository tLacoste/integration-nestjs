import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { EmailEntity } from './email/email.entity';
import { EmailResolver } from './email/email.resolver';
import { EmailService } from './email/email.service';
import { UserEntity } from './user/user.entity';
import { UserResolver } from './user/user.resolver';
import { UserService } from './user/user.service';
import { ActiveUserConstraint } from './user/user.validators';

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
  providers: [UserResolver, EmailResolver, UserService, EmailService, ActiveUserConstraint],
})
export class AppModule {}
