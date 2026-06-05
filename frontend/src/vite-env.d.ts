/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_MODE?: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_DEV_BEARER_TOKEN?: string;
  /** Same public playback ID as backend `MUX_PUBLIC_PLAYBACK_ID` for Course 1 mock videos. */
  readonly VITE_MUX_PUBLIC_PLAYBACK_ID?: string;
  /** Same signed playback ID as backend `MUX_SEED_SIGNED_PLAYBACK_ID` for mock `res-009`. */
  readonly VITE_MUX_SEED_SIGNED_PLAYBACK_ID?: string;
  /** Optional Mux Data environment key when required by your Mux project. */
  readonly VITE_MUX_ENV_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
