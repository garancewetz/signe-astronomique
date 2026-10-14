import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge the custom @theme scales from index.css. Without it,
// `text-cockpit-lg` (a size) is taken for a text color and silently drops
// the variant's color class, e.g. dark text on a light primary button.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['cockpit-xs', 'cockpit-sm', 'cockpit-md', 'cockpit-lg', 'cockpit-xl', 'cockpit-glyph', 'cockpit-input'],
      tracking: ['cockpit-tight', 'cockpit', 'cockpit-wide', 'cockpit-label', 'cockpit-caps', 'cockpit-hud'],
      radius: ['cockpit', 'panel', 'console'],
      shadow: ['cockpit-panel', 'cockpit-dock', 'cockpit-modal', 'cockpit-sheet', 'cockpit-bar', 'cockpit-lift'],
    },
  },
});

export function cn(...inputs: Array<string | false | null | undefined>) {
  return twMerge(inputs.filter(Boolean) as string[]);
}
