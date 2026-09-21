import { LocationOption, Role, User } from '../../domain/entities/user';
import { LocationModel, RoleModel, UserModel } from '../models/user.model';

export function toUser(model: UserModel): User {
  return {
    id: model.id,
    email: model.email,
    firstName: model.firstName,
    lastName: model.lastName,
    fullName: `${model.firstName} ${model.lastName}`,
    phone: model.phone ?? null,
    role: model.role,
    allLocations: model.allLocations,
    locationIds: model.locationIds ?? [],
    status: model.status,
    mustChangePassword: model.mustChangePassword,
    lastLoginAt: model.lastLoginAt ? new Date(model.lastLoginAt) : null,
    version: model.version,
  };
}

export function toRole(model: RoleModel): Role {
  return { code: model.code, assignable: model.assignable, permissions: model.permissions };
}

export function toLocationOption(model: LocationModel): LocationOption {
  return { id: model.id, name: model.name, type: model.type, primary: model.primary };
}
