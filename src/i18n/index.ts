import { fr } from './fr';
import { en } from './en';
import type { Copy } from './fr';

export type Locale = 'fr' | 'en';

export const COPY: Record<Locale, Copy> = { fr, en };

export const LOCALES: readonly Locale[] = ['fr', 'en'];

export type { Copy };
