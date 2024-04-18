import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindOptionsWhere, In, Repository } from 'typeorm';
import { EmailFiltersArgs } from './email.types';
import { EmailId, IEmail } from './email.interfaces';
import { EmailEntity } from './email.entity';

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(EmailEntity)
    private readonly emailRepository: Repository<EmailEntity>,
  ) {}

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
  getEmails(filters: EmailFiltersArgs): Promise<IEmail[]> {
    const where: FindOptionsWhere<EmailEntity> = {};

    // Gestion des filtres pour les adresses
    const addressList = filters.address?.in ?? [];
    if(filters.address?.equal){
      addressList.push(filters.address.equal);
    }
    if(addressList.length > 0){
        where.address = In(addressList);
    }
    
    return this.emailRepository.find({
      where,
      order: { address: 'asc' },
    });
  }
}
