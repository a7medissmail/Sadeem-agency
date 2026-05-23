// Ambient declarations

declare global {
  interface Window {
    // Lenis smooth-scroll instance exposed for debugging / programmatic scroll
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lenis?: any;
  }
}

declare module "*.css";

export {};
