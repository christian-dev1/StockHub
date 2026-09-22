import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Confirmation } from '../../../../shared/ui/confirm/confirmation';
import { Notifier } from '../../../../shared/ui/notifier';
import {
  DownloadBarcodeUseCase,
  GenerateBarcodeUseCase,
} from '../../domain/use-cases/barcode.use-cases';
import { BarcodePanel } from './barcode-panel';

describe('BarcodePanel', () => {
  let generate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    generate = vi.fn().mockReturnValue(of({ barcode: 'SH0000000001', format: 'CODE128' }));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:svg');
    TestBed.configureTestingModule({
      imports: [BarcodePanel],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: GenerateBarcodeUseCase, useValue: { execute: generate } },
        {
          provide: DownloadBarcodeUseCase,
          useValue: { svg: () => of(new Blob(['<svg/>'])), png: vi.fn() },
        },
        { provide: Notifier, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: Confirmation, useValue: { ask: vi.fn().mockResolvedValue(true) } },
      ],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  function render(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(BarcodePanel);
    fixture.componentRef.setInput('productId', 'p1');
    fixture.componentRef.setInput('sku', 'PRD-1');
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    return fixture;
  }

  const buttons = (el: HTMLElement) =>
    [...el.querySelectorAll('button')].map((b) => b.textContent?.trim() ?? '');

  it('offers generation only when the product has no barcode and the user may generate', async () => {
    const fixture = render({ canGenerate: true });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(buttons(el).filter((b) => b.startsWith('barcodes.actions.generate'))).toHaveLength(2);
    expect(el.textContent).not.toContain('PNG');

    const readOnly = render({ canGenerate: false });
    await readOnly.whenStable();
    expect(buttons(readOnly.nativeElement as HTMLElement)).toEqual([]);
  });

  it('shows the preview and downloads for an existing barcode, replacement kept aside', async () => {
    const fixture = render({ barcode: '2000000000015', barcodeFormat: 'EAN13', canGenerate: true });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('img')?.getAttribute('src')).toBe('blob:svg');
    expect(el.querySelector('[data-testid="barcode-value"]')?.textContent).toBe('2000000000015');
    expect(buttons(el)).toEqual(expect.arrayContaining(['PNG', 'SVG']));
    expect(el.querySelector('details')).not.toBeNull();
  });

  it('asks before replacing an existing barcode', async () => {
    const fixture = render({ barcode: '2000000000015', barcodeFormat: 'EAN13', canGenerate: true });
    await fixture.whenStable();
    const confirm = TestBed.inject(Confirmation).ask as ReturnType<typeof vi.fn>;
    const replace = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('details button'),
    ][1] as HTMLButtonElement;
    replace.click();
    await fixture.whenStable();
    expect(confirm).toHaveBeenCalled();
    expect(generate).toHaveBeenCalledWith('p1', 'CODE128', true);
  });
});
