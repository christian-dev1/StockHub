import { Provider } from '@angular/core';
import { UsersDataSource } from './data/datasources/users.datasource';
import { HttpUsersRepository } from './data/repositories/http-users.repository';
import { UsersRepository } from './domain/repositories/users.repository';
import {
  CreateUserUseCase,
  GetUserReferenceDataUseCase,
  GetUserUseCase,
  SearchUsersUseCase,
  UpdateUserUseCase,
} from './domain/use-cases/user.use-cases';

export const USERS_PROVIDERS: Provider[] = [
  UsersDataSource,
  { provide: UsersRepository, useClass: HttpUsersRepository },
  SearchUsersUseCase,
  GetUserUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  GetUserReferenceDataUseCase,
];
