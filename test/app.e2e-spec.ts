import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { UserEntity } from '../src/user/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailEntity } from '../src/email/email.entity';

const knownUserId = '0f9fcea9-f618-44e5-b182-0e3c83586f8b';

const knownUser = {
  id: knownUserId,
  name: 'Moi Même',
  status: 'active',
  birthdate: new Date(1989, 3, 8).toISOString(),
  emails: [
    {
      userId: knownUserId,
      id: 'f7176922-9ae8-4ac7-b1d9-d6b8ed75475b',
      address: 'test1@upcse-integration.coop',
    },
    {
      userId: knownUserId,
      id: 'f6035e0a-25b4-40a9-818d-cb7420495d26',
      address: 'test2@upcse-integration.coop',
    },
    {
      userId: knownUserId,
      id: '1983ee1f-e64e-4dfd-9a28-ee4827d68993',
      address: 'test3@upcse-integration.coop',
    },
  ],
};

const [email1, email2, email3] = knownUser.emails;

describe('Tests e2e', () => {
  let app: INestApplication;

  let userRepo: Repository<UserEntity>;
  let emailRepo: Repository<EmailEntity>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    userRepo = moduleFixture.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    emailRepo = moduleFixture.get<Repository<EmailEntity>>(
      getRepositoryToken(EmailEntity),
    );

    const { emails, ...user } = knownUser;
    await userRepo.insert(user);
    await emailRepo.insert(emails);

    await app.init();
  });

  afterEach(async () => {
    await emailRepo.query(`DELETE FROM emails`);
    await userRepo.query(`DELETE FROM users`);
  });

  describe('UserResolver', () => {
    describe('[Query] user', () => {
      it(`[01] Devrait retourner l'utilisateur connu en base de données`, () => {
        const user = {
          id: knownUserId,
          name: knownUser.name,
          birthdate: knownUser.birthdate,
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{user(userId:"${knownUserId}"){id name birthdate}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.user).toStrictEqual(user);
          });
      });

      it(`[02] Devrait pouvoir résoudre les e-mails de l'utilisateur`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{user(userId:"${knownUserId}"){id emails{id address}}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors?.[0]?.message).not.toBe(
              'Cannot return null for non-nullable field UserEmail.id.',
            );
            expect(res.body.data.user.emails.length).toBe(3);
          });
      });

      it(`[03] Devrait pouvoir résoudre les e-mails avec les filtres`, () => {
        const { userId, ...email } = email1;
        const knownUser = {
          id: knownUserId,
          emails: [email],
        };

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{user(userId:"${knownUser.id}"){id emails(address:{equal: "${email.address}"}){id address}}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.user).toStrictEqual(knownUser);
          });
      });

      it(`[04] Devrait retourner une erreur de validation si aucun identifiant d'utilisateur n'est défini`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{user(userId:""){id}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors?.[0].extensions?.originalError?.message,
            ).toContain("L'identifiant de l'utilisateur doit être défini");
          });
      });

      it(`[05] Devrait retourner une erreur de validation si l'identifiant de l'utilisateur n'est pas un UUID`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{user(userId:"NotAnUUID"){id}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors?.[0]?.extensions?.originalError?.message,
            ).toContain("L'identifiant de l'utilisateur doit être un UUID");
          });
      });

      it(`[06] Devrait retourner les emails égaux tout comme les emails contenus`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{user(userId:"${knownUserId}"){
              emails(address: {
                equal: "${email2.address}", 
                in: ["${email1.address}", "${email3.address}"]
              }){id}}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.user.emails.length).toBe(3);
          });
      });
    });

    describe('[Mutation] addUser', () => {
      it(`[07] Devrait ajouter un utilisateur`, () => {
        const date = new Date(2001, 11, 12).toISOString();

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {addUser(name:"User Name", birthdate: "${date}")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.addUser).toBeDefined();
          });
      });

      it.skip(`[08] Devrait retourner une erreur de validation si le nom n'est pas défini`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {addUser(name:"")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors?.[0].extensions?.originalError?.message,
            ).toContain("Le nom de l'utilisateur n'est pas défini");
          });
      });

      it.skip(`[09] Devrait retourner une erreur de validation si la date de naissance est définie dans le future`, () => {
        const date = new Date(2050, 1, 1).toISOString();
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `mutation {addUser(name:"User Name" birthdate:"${date}")}`,
          })
          .expect(200)
          .expect((res) => {
            expect(
              res.body.errors?.[0]?.extensions?.originalError?.message,
            ).toContain(
              'La date de naissance ne peut pas être définie dans le future',
            );
          });
      });
    });
  });

  describe('EmailResolver', () => {
    describe('[Query] email', () => {
      it.skip(`[10] Devrait retourner l'email connu en base de données`, () => {
        const { userId, ...email } = email3;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{email(emailId:"${email.id}"){id address}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors?.[0]?.message).not.toBe('Not Implemented');
            expect(res.body.data?.email).toStrictEqual(email);
          });
      });
    });

    describe('[Query] emailsList', () => {
      it.skip(`[11] Devrait retourner les emails correspondants aux filtres`, () => {
        const { userId, ...email } = email2;

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{emailsList(address: {equal: "${email.address}"}){id address}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors?.[0]?.message).not.toBe('Not Implemented');
            expect(res.body.data?.emailsList[0]).toStrictEqual(email);
          });
      });
    });

    describe('[FieldResolver] user', () => {
      it.skip(`[12] Devrait retourner l'utilisateur de l'email`, () => {
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `{emailsList(address:{equal:"${email1.address}"}){user{id}}}`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors?.[0]?.message).not.toBe('Not Implemented');
            expect(res.body.data?.emailsList[0].user.id).toBe(knownUserId);
          });
      });
    });
  });
});
