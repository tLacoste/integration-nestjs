import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../src/email/email.service';
import { AppModule } from '../src/app.module';
import { QueryFailedError, Repository } from 'typeorm';
import { EmailEntity } from '../src/email/email.entity';
import { UserEntity } from '../src/user/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { email2, inexistentUUID, knownInactiveUserRaw, knownUserRaw } from './spec-data';
import { InvalidEmailError } from '../src/email/email.errors';

const getError = async (call: () => unknown): Promise<Error> => {
try {
    await call();

    return null;
} catch (error) {
    if(error instanceof Error){
        return error;
    }
    throw new Error("Erreur non gérée");
}
};

describe('EmailService', () => { 
    let app: INestApplication;

    let emailService: EmailService; 

    let userRepo: Repository<UserEntity>;
    let emailRepo: Repository<EmailEntity>;
    beforeEach(async () => { 
        const moduleFixture: TestingModule = await Test.createTestingModule({
          imports: [AppModule],
        }).compile();
    
        app = moduleFixture.createNestApplication();

        userRepo = moduleFixture.get<Repository<UserEntity>>(
          getRepositoryToken(UserEntity),
        );
        emailRepo = moduleFixture.get<Repository<EmailEntity>>(
          getRepositoryToken(EmailEntity),
        );

        const { emails, ...user } = knownUserRaw;
        await userRepo.insert(user);
        await emailRepo.insert(emails);
    
        const { emails: inactiveEmails, ...inactiveUser } = knownInactiveUserRaw;
        await userRepo.insert(inactiveUser);
        await emailRepo.insert(inactiveEmails);

        await app.init();

        emailService = moduleFixture.get<EmailService>(EmailService);  
    }); 

    afterEach(async () => {
      await emailRepo.query(`DELETE FROM emails`);
      await userRepo.query(`DELETE FROM users`);
    });


    it('should be defined', () => { 
        expect(emailService).toBeDefined(); 
    });

    describe('get', () => { 
        it(`Devrait retourner l'utilisateur connu en base de données`, async () => { 
            expect(await emailService.get(knownUserRaw.emails[0].id))
            .toEqual(knownUserRaw.emails[0]); 
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => { 
            const error = await getError(async () => await emailService.get(""));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const error = await getError(async () => await emailService.get("NotAnUUID"));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
        });
        it(`Devrait retourner une erreur si l'identifiant est inexitant`, async () => { 
            expect(await emailService.get(inexistentUUID)).toBeNull();
        });
    });

    describe('getEmails', () => { 
        it(`Devrait retourner les emails correspondants au filtre 'equal'`, async () => { 
            const { userId, ...email } = email2;
            let emails = await emailService.getEmails({address: {equal: email.address, in: []}});
            expect(emails).toHaveLength(1);
            expect(emails[0]).toEqual(email2); 
        });
        it(`Devrait retourner les emails correspondants au filtre 'in'`, async () => { 
            let emails = await emailService.getEmails({address: {equal: "", in: knownUserRaw.emails.map(email => email.address)}});
            expect(emails).toHaveLength(knownUserRaw.emails.length);
            knownUserRaw.emails.forEach((email, index) => {
                expect(emails[index]).toEqual(email); 
            });
        });
        it(`Devrait retourner les emails correspondants aux filtres 'equal' et 'in'`, async () => { 
            let emails = await emailService.getEmails({address: {equal: knownInactiveUserRaw.emails[0].address, in: knownUserRaw.emails.map(email => email.address)}});
            expect(emails).toHaveLength(knownUserRaw.emails.length + 1);
            expect(emails).toContainEqual(knownInactiveUserRaw.emails[0]);  
            knownUserRaw.emails.forEach((email, index) => {
                expect(emails).toContainEqual(email); 
            });
        });
        it(`Devrait retourner tous les emails`, async () => { 
            let emails = await emailService.getEmails({address: {equal: "", in: []}});
            expect(emails).toHaveLength(knownInactiveUserRaw.emails.length + knownUserRaw.emails.length);
        });
    });

    describe('delete', () => { 
        it(`Devrait supprimer l'email connu en base de données`, async () => { 
            expect(await emailService.delete(knownUserRaw.emails[0].id))
            .toEqual(knownUserRaw.emails[0].id); 
        });
        it(`Devrait retourner une erreur si l'utilisateur associé est inactif`, async () => { 
            const error = await getError(async () => await emailService.delete(knownInactiveUserRaw.emails[0].id));
            expect(error).toBeInstanceOf(InvalidEmailError);
            expect(error.message).toBe(`L'utilisateur associé à l'email doit être un utilisateur actif`);
        });
        it(`Devrait retourner une erreur si l'identifiant n'est pas défini`, async () => { 
            const error = await getError(async () => await emailService.delete(""));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: ""`);
        });
        it(`Devrait retourner une erreur si l'identifiant est invalide`, async () => { 
            const error = await getError(async () => await emailService.delete("NotAnUUID"));
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(error.message).toBe(`invalid input syntax for type uuid: "NotAnUUID"`);
        });
        it(`Devrait retourner une erreur si l'utilisateur associé est inexitant`, async () => { 
            const error = await getError(async () => await emailService.delete(inexistentUUID));
            expect(error).toBeInstanceOf(InvalidEmailError);
            expect(error.message).toBe(`L'identifiant de l'email est invalide`);
        });
    });
});
