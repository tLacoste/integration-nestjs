import { ArgsType, Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { Maybe } from 'graphql/jsutils/Maybe';
import { IEmail, IEmailFilters } from './email.interfaces';

@ObjectType()
export class UserEmail implements IEmail {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  address: string;

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
