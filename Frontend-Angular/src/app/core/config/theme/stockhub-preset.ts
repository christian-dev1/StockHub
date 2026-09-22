import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/** PrimeNG preset aligned with the StockHub design tokens (indigo primary). */
export const StockHubPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}',
    },
    colorScheme: {
      light: {
        primary: { color: '{indigo.700}', hoverColor: '{indigo.800}', activeColor: '{indigo.900}' },
        // Placeholders follow the secondary text token (WCAG AA 4.5:1 in both themes).
        formField: { placeholderColor: 'var(--sh-text-secondary)' },
      },
      dark: {
        primary: { color: '{indigo.300}', hoverColor: '{indigo.200}', activeColor: '{indigo.100}' },
        formField: { placeholderColor: 'var(--sh-text-secondary)' },
        surface: {
          0: '#ffffff',
          50: '#eef2f8',
          100: '#d5dbe6',
          200: '#b3bdcd',
          300: '#9ba7bb',
          400: '#6f7c93',
          500: '#4b5770',
          600: '#34405a',
          700: '#27314a',
          800: '#1b2336',
          900: '#121829',
          950: '#0b1020',
        },
      },
    },
  },
  components: {
    // Aura's 36x22 px switch is below the 24 px touch target of WCAG 2.2 AA (2.5.8).
    toggleswitch: {
      root: { width: '2.75rem', height: '1.5rem' },
      handle: { size: '1rem' },
    },
  },
});
