import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmailEntity } from '../email/email.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'timestamptz', nullable: true })
  birthdate?: Date | null;

  @Column({ type: 'varchar', length: 8 })
  status: string;

  @OneToMany(() => EmailEntity, (email) => email.user)
  emails: EmailEntity[];
}
