import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GeocodingResult } from '../../geocoding/types';

@Entity('client')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  name: string;

  @Column('text')
  lastName: string;

  @Column('text')
  street: string;

  @Column('text')
  city: string;

  @Column('text')
  province: string;

  @Column('text')
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'success', 'ambiguous', 'failed'],
    default: 'pending',
  })
  geocodingStatus: 'pending' | 'success' | 'ambiguous' | 'failed';

  @Column({ type: 'jsonb', nullable: true })
  geocodingResults: GeocodingResult | GeocodingResult[] | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
