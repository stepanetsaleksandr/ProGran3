import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '../../errors/api.error';

// Базовий репозиторій для всіх репозиторіїв
export abstract class BaseRepository<T> {
  constructor(protected supabase: SupabaseClient) {}
  
  abstract create(data: Partial<T>): Promise<T>;
  abstract findById(id: number): Promise<T | null>;
  abstract update(id: number, data: Partial<T>): Promise<T>;
  abstract delete(id: number): Promise<boolean>;
  
  protected handleError(message: string, error: any): never {
    throw new DatabaseError(message, error);
  }
}
