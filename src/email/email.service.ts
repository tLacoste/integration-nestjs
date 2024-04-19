import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Maybe } from 'graphql/jsutils/Maybe';
import { Equal, FindOptionsWhere, In, Repository } from 'typeorm';
import { EmailEntity } from './email.entity';
import { EmailId, IAddEmail, IEmail } from './email.interfaces';
import { EmailFiltersArgs, StringFilters } from './email.types';

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(EmailEntity)
    private readonly emailRepository: Repository<EmailEntity>
  ) {}

  /**
   * Ajoute un email
   * @param email Email à ajouter au système
   */
  async add(email: IAddEmail) {
    const addedEmail = await this.emailRepository.insert(email);
    const emailId = addedEmail.identifiers[0].id;

    return emailId;
  }

  /**
     * Récupère un email par rapport à un identifiant
     * @param id Identifiant de l'email à récupérer
     * @returns L'email correspondant à l'identifiant ou undefined
     */
  get(id: EmailId): Promise<IEmail> {
    return this.emailRepository.findOneBy({ id: Equal(id) });
  }
  
  /**
   * Récupère l'ensemble des emails correspondants aux paramètres d'entrée
   * @param filters Filtre sur les Id
   * @param options 
   * @returns 
   */
  getEmails(filters: EmailFiltersArgs, userFilter?: Maybe<Pick<StringFilters, 'equal'>>): Promise<IEmail[]> {
    const where: FindOptionsWhere<EmailEntity> = {};

    // Gestion des filtres pour les adresses
    const addressList = filters.address?.in ?? [];
    if(filters.address?.equal){
      addressList.push(filters.address.equal);
    }
    if(addressList.length > 0){
        where.address = In(addressList);
    }

    // Gestion des filtres pour l'utilisateur
    if(userFilter?.equal){
      where.userId = Equal(userFilter.equal);
    }
    
    return this.emailRepository.find({
      where,
      order: { address: 'asc' },
    });
  }
}
