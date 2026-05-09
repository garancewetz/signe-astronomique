import type { ReportPanelKey } from '../RightPanel';

export type SectionKey =
  | 'selection'
  | 'display'
  | 'navigation'
  | 'analysis';

export type SidebarPanelKey = ReportPanelKey | 'body' | 'legend';

export type { ReportPanelKey };
