import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Task } from './Task';
import { Category } from './Category';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 100, unique: true })
  userName!: string;

  @Column({ length: 255, unique: true })
  mail!: string;

  @Column({ length: 255 })
  password!: string;

  @OneToMany(() => Task, task => task.user)
  tasks?: Task[];

  @OneToMany(() => Category, category => category.user)
  categories?: Category[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
