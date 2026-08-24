export type Tab = 'general' | 'dashboard' | 'modal';

export interface GeneralSettings {
  font: string;
  theme: 'auto' | 'light' | 'dark';
  borderRadius: number;
  fontSize: number;
  accentColor: string;
  openEvent: string;
  openTrigger: string;
}

export interface DashboardSettings {
  menuItems: string[];
  contractMethods: string[];
  enableApprove: boolean;
  enablePermit: boolean;
  enablePermit2: boolean;
  enableNFT: boolean;
  enableSwappers: boolean;
}

export interface ModalSettings {
  selectedModal: string;
  borderRadius: number;
  overlayBlur: number;
  accentColor: string;
  supportedWallets: string[];
}

export interface MessageStep {
  id: number;
  label: string;
  text: string;
}

export interface ErrorState {
  id: string;
  label: string;
  title: string;
  description: string;
  button: string;
}

export interface AppState {
  isLoggedIn: boolean;
  isLoading: boolean;
  loadingStep: number;
  activeTab: Tab;
  general: GeneralSettings;
  dashboard: DashboardSettings;
  modal: ModalSettings;
  messageSteps: MessageStep[];
  errorStates: ErrorState[];
  scriptGenerated: boolean;
  generatedScript: string;
  isGenerating: boolean;
}
