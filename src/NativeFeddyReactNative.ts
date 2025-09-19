import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type FeddyUser = {
  userId: string;
  email: string | null;
  name: string | null;
};

export type ConfigureOptions = {
  apiKey: string;
  enableDebugLogging?: boolean;
};

export type UpdateUserOptions = {
  userId?: string | null;
  email?: string | null;
  name?: string | null;
};

export type FeddyState = {
  apiKey: string | null;
  baseUrl: string;
  isConfigured: boolean;
  sdkVersion: string;
  user: FeddyUser;
};

export interface Spec extends TurboModule {
  configure(options: ConfigureOptions): FeddyState;
  updateUser(options: UpdateUserOptions): FeddyUser;
  resetUserData(): FeddyUser;
  hasPersistentUserData(): boolean;
  getUser(): FeddyUser;
  getState(): FeddyState;
}

export default TurboModuleRegistry.getEnforcing<Spec>('FeddyReactNative');
