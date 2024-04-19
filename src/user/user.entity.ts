import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmailEntity } from '../email/email.entity';
import { UserStatus } from './user.interfaces';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'timestamptz', nullable: true })
  birthdate?: Date | null;

  @Column({ type: 'enum', enum: ["active", "inactive"], default: "active" })
  status: UserStatus;

  @OneToMany(() => EmailEntity, (email) => email.user)
  emails: EmailEntity[];
}
