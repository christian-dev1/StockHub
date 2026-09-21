import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { RoleCode } from '../../../../core/config/permissions/permissions';
import { passwordStrength } from '../../../../shared/utils/validators';
import { User } from '../../domain/entities/user';
import { AccessForm, locationsRequired } from './user-access-fields';

export function accessForm(fb: NonNullableFormBuilder, user?: User): AccessForm {
  return fb.group(
    {
      role: fb.control<RoleCode | null>(user?.role ?? null, Validators.required),
      allLocations: fb.control(user?.allLocations ?? false),
      locationIds: fb.control<string[]>([...(user?.locationIds ?? [])]),
    },
    { validators: (g) => locationsRequired(g as AccessForm) },
  );
}

export function profileForm(fb: NonNullableFormBuilder, user?: User) {
  return fb.group({
    firstName: [user?.firstName ?? '', [Validators.required, Validators.maxLength(80)]],
    lastName: [user?.lastName ?? '', [Validators.required, Validators.maxLength(80)]],
    phone: [user?.phone ?? '', Validators.maxLength(40)],
  });
}

export function newUserForm(fb: NonNullableFormBuilder) {
  return fb.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    profile: profileForm(fb),
    access: accessForm(fb),
    temporaryPassword: ['', [Validators.required, passwordStrength]],
  });
}
