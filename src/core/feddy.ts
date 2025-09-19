import type {
  ConfigureOptions,
  FeddyState,
  FeddyUser,
  UpdateUserOptions,
} from './nativeModule';
import { nativeModule, normalizeState, normalizeUser } from './nativeModule';

export type { ConfigureOptions, FeddyState, FeddyUser, UpdateUserOptions };

const Feddy = {
  configure(options: ConfigureOptions): FeddyState {
    const state = nativeModule.configure(options);
    return normalizeState(state);
  },

  updateUser(options: UpdateUserOptions): FeddyUser {
    const user = nativeModule.updateUser(options);
    return normalizeUser(user);
  },

  resetUserData(): FeddyUser {
    const user = nativeModule.resetUserData();
    return normalizeUser(user);
  },

  hasPersistentUserData(): boolean {
    return nativeModule.hasPersistentUserData();
  },

  getUser(): FeddyUser {
    const user = nativeModule.getUser();
    return normalizeUser(user);
  },

  getState(): FeddyState {
    const state = nativeModule.getState();
    return normalizeState(state);
  },
} as const;

export default Feddy;
