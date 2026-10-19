// Gedeeld met het vangnet in index.html; zie daar voor de uitleg.
interface Window {
  __trainlogFatal?: (error: unknown) => void;
  __trainlogMounted?: boolean;
  __TRAINLOG_BUILD__?: string;
}

/** Commit en bouwtijd, ingevuld door Vite (zie vite.config.ts). */
declare const __APP_BUILD__: string;
