import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Location, LocationDraft, LocationType } from '../../domain/entities/location';

/** Same rules as the backend LocationRequest. */
export const LOCATION_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export function locationForm(fb: NonNullableFormBuilder, location?: Location) {
  return fb.group({
    code: [
      location?.code ?? '',
      [Validators.required, Validators.maxLength(30), Validators.pattern(LOCATION_CODE_PATTERN)],
    ],
    name: [location?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    type: fb.control<LocationType>(location?.type ?? 'STORE', Validators.required),
    addressLine: [location?.addressLine ?? '', Validators.maxLength(255)],
    city: [location?.city ?? '', Validators.maxLength(100)],
    phone: [location?.phone ?? '', Validators.maxLength(40)],
  });
}

export type LocationForm = ReturnType<typeof locationForm>;

export function toLocationDraft(form: LocationForm): LocationDraft {
  return form.getRawValue();
}
