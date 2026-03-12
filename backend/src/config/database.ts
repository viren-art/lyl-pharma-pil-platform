import { DataSource } from 'typeorm';
import { Translation } from '../models/translation.model';
import { PIL } from '../models/pil.model';
import { TranslationMemory } from '../models/translation-memory.model';
import { AuditLog } from '../models/audit-log.model';
import { User } from '../models/user.model';
import { Tenant } from '../models/tenant.model';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'pil_platform',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Translation, PIL, TranslationMemory, AuditLog, User, Tenant],
});