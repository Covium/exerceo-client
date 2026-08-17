/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ANDROID?: string;
}

interface Window {
  ExerceoNative?: {
    request(id: string, method: string, argsJson: string): void;
  };
  __exerceoResolve?: (id: string, payloadJson: string) => void;
  __exerceoReject?: (id: string, message: string) => void;
}
