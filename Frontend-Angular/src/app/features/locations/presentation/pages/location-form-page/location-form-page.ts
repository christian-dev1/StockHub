import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { AppError } from '../../../../../core/errors/app-error';
import { LanguageStore } from '../../../../../core/i18n/language-store';
import { ErrorState } from '../../../../../shared/ui/error-state/error-state';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { Notifier } from '../../../../../shared/ui/notifier';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { ResourceState } from '../../../../../shared/utils/resource-state';
import { applyServerErrors } from '../../../../../shared/utils/server-errors';
import { LOCATION_TYPES, Location } from '../../../domain/entities/location';
import {
  GetLocationUseCase,
  SaveLocationUseCase,
} from '../../../domain/use-cases/location.use-cases';
import { locationForm, toLocationDraft } from '../../forms/location-form';

/** Creates a location, or edits the one given by the route. */
@Component({
  selector: 'app-location-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    ErrorState,
    FormField,
    PageHeader,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './location-form-page.html',
})
export class LocationFormPage implements OnInit {
  readonly locationId = input<string>();

  private readonly getLocation = inject(GetLocationUseCase);
  private readonly save = inject(SaveLocationUseCase);
  private readonly router = inject(Router);
  private readonly notifier = inject(Notifier);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageStore);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly routes = APP_ROUTES;
  protected readonly location = new ResourceState<Location>(inject(DestroyRef));
  protected readonly form = locationForm(this.fb);
  protected readonly saving = signal(false);
  protected readonly editing = computed(() => !!this.locationId());
  protected readonly typeOptions = computed(() => {
    this.language.language();
    return LOCATION_TYPES.map((value) => ({
      value,
      label: this.translate.instant(`locations.types.${value}`) as string,
    }));
  });

  constructor() {
    effect(() => {
      const location = this.location.data();
      if (location && this.form.pristine) {
        this.form.reset(locationForm(this.fb, location).getRawValue());
      }
    });
  }

  ngOnInit(): void {
    const id = this.locationId();
    if (!id) return;
    this.location.load(this.getLocation.execute(id));
  }

  protected retry(): void {
    const id = this.locationId();
    if (id) this.location.load(this.getLocation.execute(id));
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const draft = toLocationDraft(this.form);
    const current = this.location.data();
    const request = current
      ? this.save.update(current.id, draft, current.version)
      : this.save.create(draft);
    this.saving.set(true);
    request.subscribe({
      next: (location) => {
        this.notifier.success(current ? 'common.saved' : 'locations.saved.created', {
          name: location.name,
        });
        void this.router.navigateByUrl(APP_ROUTES.LOCATIONS.ROOT);
      },
      error: (error: AppError) => {
        this.saving.set(false);
        if (!applyServerErrors(this.form, error)) this.notifier.error(error);
      },
    });
  }
}
