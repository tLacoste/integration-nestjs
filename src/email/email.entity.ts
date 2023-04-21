import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'emails' })
export class EmailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.emails)
  @JoinColumn({ name: 'user_id' })
  user?: string;
}
