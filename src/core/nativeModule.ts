import type {
  ConfigureOptions,
  FeddyState,
  FeddyUser,
  UpdateUserOptions,
} from '../NativeFeddyReactNative';
import NativeFeddyReactNative from '../NativeFeddyReactNative';
import packageJson from '../../package.json';
import { FeddyAPIClient } from '../api/client';

const JS_SDK_VERSION: string = packageJson.version;

function ensureNativeModule(): typeof NativeFeddyReactNative {
  if (!NativeFeddyReactNative) {
    throw new Error(
      'Feddy native module is unavailable. Did you run pod install and rebuild the app?'
    );
  }

  return NativeFeddyReactNative;
}

function withSdkVersion<T extends { sdkVersion?: string }>(value: T): T {
  return {
    ...value,
    sdkVersion: value.sdkVersion ?? JS_SDK_VERSION,
  };
}

function normalizeUser(user: FeddyUser): FeddyUser {
  return {
    userId: user.userId,
    email: user.email ?? null,
    name: user.name ?? null,
  };
}

function normalizeState(state: FeddyState): FeddyState {
  return {
    ...withSdkVersion(state),
    apiKey: state.apiKey ?? null,
    user: normalizeUser(state.user),
  };
}

const nativeModule = ensureNativeModule();

function ensureConfiguredState(): FeddyState & { apiKey: string } {
  const state = normalizeState(nativeModule.getState());

  if (!state.isConfigured || !state.apiKey) {
    throw new Error(
      'Feddy SDK is not configured. Call Feddy.configure() first.'
    );
  }

  return { ...state, apiKey: state.apiKey };
}

function createApiClient(
  state?: FeddyState & { apiKey: string }
): FeddyAPIClient {
  const currentState = state ?? ensureConfiguredState();
  return new FeddyAPIClient({
    apiKey: currentState.apiKey,
    baseUrl: currentState.baseUrl,
  });
}

export type { ConfigureOptions, FeddyState, FeddyUser, UpdateUserOptions };
export {
  JS_SDK_VERSION,
  nativeModule,
  normalizeUser,
  normalizeState,
  ensureConfiguredState,
  createApiClient,
};
