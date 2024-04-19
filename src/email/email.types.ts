import { ArgsType, Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Maybe } from 'graphql/jsutils/Maybe';
import { IAddEmail, IEmail, IEmailFilters } from './email.interfaces';
import { IsActiveUser } from '../user/user.validators';

@ObjectType()
export class UserEmail implements IEmail {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  address: string;

  @Field(() => ID)
  userId: string;
}

/**
 * Type d'entrée GraphQL d'un email à ajouter
 */
@InputType()
@ArgsType()
export class AddEmail implements IAddEmail {
  @IsNotEmpty({ message: `L'adresse email n'est pas définie` })
  @IsEmail({}, { message: `L'adresse email est invalide`})
  @Field(() => String)
  address: string;

  @IsUUID('all', {
    message: `L'identifiant d'utilisateur doit être un UUID`,
  })
  @IsNotEmpty({ message: `L'identifiant d'utilisateur doit être défini` })
  @Field(() => String)
  userId: string;
}

@InputType()
export class StringFilters {
  @IsOptional()
  @Field(() => String, { nullable: true })
  equal: Maybe<string>;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  in: Maybe<string[]>;
}

@ArgsType()
export class EmailFiltersArgs implements IEmailFilters {
  @IsOptional()
  @Field(() => StringFilters, { nullable: true })
  address?: Maybe<StringFilters>;
}

/**
 * Type Argument GraphQL pour les queries / mutations ayant uniquement
 * besoin d'un identifiant email
 */
@ArgsType()
export class EmailIdArgs {
  @IsActiveUser()
  @IsUUID('all', {
    message: `L'identifiant de l'email doit être un UUID`,
  })
  @IsNotEmpty({ message: `L'identifiant de l'email doit être défini` })
  @Field(() => String)
  emailId: string;
}