import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Maybe } from 'graphql/jsutils/Maybe';
import { Equal, FindOptionsWhere, In, Repository } from 'typeorm';
import { EmailEntity } from './email.entity';
import { EmailId, IAddEmail, IEmail } from './email.interfaces';
import { EmailFiltersArgs, StringFilters } from './email.types';
import { UserService } from '../user/user.service';
import { InvalidEmailError, InvalidUserError } from './email.errors';

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(EmailEntity)
    private readonly _emailRepository: Repository<EmailEntity>,
    private readonly _userService: UserService
  ) {}

  /**
   * Ajoute un email
   * @param email Email à ajouter au système
   */
  async add(email: IAddEmail) {
    const user = await this._userService.get(email.userId);
    if(user.status !== "active"){
      throw new InvalidUserError("L'identifiant d'utilisateur doit correspondre à un utilisateur actif");
    }

    const addedEmail = await this._emailRepository.insert(email);
    const emailId = addedEmail.identifiers[0].id;

    return emailId;
  }

  /**
   * Supprime un email
   * @param emailId L'identifiant de l'email à supprimer du système
   */
  async delete(emailId: EmailId) {
    const email = await this.get(emailId);
    if(!email){
      throw new InvalidEmailError("L'identifiant de l'email est invalide");
    }
    const user = await this._userService.get(email.userId);
    if(user.status !== "active"){
      throw new InvalidEmailError("L'utilisateur associé à l'email doit être un utilisateur actif");
    }

    const removedEmail = await this._emailRepository.delete(emailId);
    const removedId = removedEmail.affected ? emailId : null;
    return removedId;
  }

  /**
     * Récupère un email par rapport à un identifiant
     * @param id Identifiant de l'email à récupérer
     * @returns L'email correspondant à l'identifiant ou undefined
     */
  get(id: EmailId): Promise<IEmail> {
    return this._emailRepository.findOneBy({ id: Equal(id) });
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
    
    return this._emailRepository.find({
      where,
      order: { address: 'asc' },
    });
  }
}
