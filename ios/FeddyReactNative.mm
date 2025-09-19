#import "FeddyReactNative.h"

#import <React/RCTLog.h>
#import <optional>

static NSString *const kFeddyBaseURL = @"https://feddy.app";
static NSString *const kFeddySDKVersion = @"1.0.0";

static NSString *const kDefaultsSuiteName = @"com.feddy.sdk";
static NSString *const kDefaultsApiKeyKey = @"com.feddy.sdk.apiKey";
static NSString *const kDefaultsDebugLoggingKey = @"com.feddy.sdk.debug";
static NSString *const kDefaultsUserIdKey = @"com.feddy.sdk.userId";
static NSString *const kDefaultsUserEmailKey = @"com.feddy.sdk.userEmail";
static NSString *const kDefaultsUserNameKey = @"com.feddy.sdk.userName";

static inline id _Nullable NullableString(NSString *_Nullable value) {
  return value != nil ? value : [NSNull null];
}

@interface FeddyReactNative ()

@property (nonatomic, readonly) NSUserDefaults *defaults;
@property (nonatomic, readonly) BOOL debugLoggingEnabled;

@end

@implementation FeddyReactNative {
  BOOL _debugLogging;
}

RCT_EXPORT_MODULE()

- (instancetype)init {
  self = [super init];
  if (self) {
    NSNumber *debugValue = [self.defaults objectForKey:kDefaultsDebugLoggingKey];
    _debugLogging = debugValue ? debugValue.boolValue : NO;
  }
  return self;
}

- (NSUserDefaults *)defaults {
  NSUserDefaults *defaults = [[NSUserDefaults alloc] initWithSuiteName:kDefaultsSuiteName];
  return defaults ?: [NSUserDefaults standardUserDefaults];
}

- (BOOL)debugLoggingEnabled {
  return _debugLogging;
}

- (void)setDebugLoggingEnabled:(BOOL)enabled {
  _debugLogging = enabled;
  [self.defaults setBool:enabled forKey:kDefaultsDebugLoggingKey];
}

- (BOOL)isConfigured {
  NSString *apiKey = [self.defaults stringForKey:kDefaultsApiKeyKey];
  return apiKey.length > 0;
}

- (NSString *)ensureUserIdentifier {
  NSString *identifier = [self.defaults stringForKey:kDefaultsUserIdKey];
  if (identifier.length == 0) {
    identifier = [[NSUUID UUID] UUIDString];
    [self.defaults setObject:identifier forKey:kDefaultsUserIdKey];
  }
  return identifier;
}

- (NSDictionary *)currentUserDictionary {
  NSString *userId = [self ensureUserIdentifier];
  NSString *email = [self.defaults stringForKey:kDefaultsUserEmailKey];
  NSString *name = [self.defaults stringForKey:kDefaultsUserNameKey];

  return @{
    @"userId": userId ?: @"",
    @"email": NullableString(email),
    @"name": NullableString(name)
  };
}

- (NSDictionary *)currentStateDictionary {
  NSString *apiKey = [self.defaults stringForKey:kDefaultsApiKeyKey];
  NSDictionary *user = [self currentUserDictionary];

  return @{
    @"apiKey": apiKey ?: [NSNull null],
    @"baseUrl": kFeddyBaseURL,
    @"isConfigured": @(self.isConfigured),
    @"sdkVersion": kFeddySDKVersion,
    @"user": user
  };
}

- (void)logDebugMessage:(NSString *)message {
  if (!self.debugLoggingEnabled) {
    return;
  }
  RCTLogInfo(@"[Feddy] %@", message);
}

- (NSDictionary *)configure:(JS::NativeFeddyReactNative::ConfigureOptions &)options {
  NSString *apiKey = options.apiKey();
  const std::optional<bool> debugFlag = options.enableDebugLogging();
  BOOL enableDebug = debugFlag.has_value() ? (*debugFlag ? YES : NO) : NO;

  if (apiKey == nil || apiKey.length == 0) {
    RCTLogWarn(@"[Feddy] Configuration failed: API key cannot be empty");
    return [self currentStateDictionary];
  }

  [self.defaults setObject:apiKey forKey:kDefaultsApiKeyKey];
  [self setDebugLoggingEnabled:enableDebug];
  [self ensureUserIdentifier];

  if (enableDebug) {
    [self logDebugMessage:[NSString stringWithFormat:@"SDK configured with API key prefix %@", [apiKey substringToIndex:MIN((NSUInteger)8, apiKey.length)]]];
  }

  return [self currentStateDictionary];
}

- (NSDictionary *)updateUser:(JS::NativeFeddyReactNative::UpdateUserOptions &)options {
  if (!self.isConfigured) {
    RCTLogWarn(@"[Feddy] Attempted to update user before configure was called");
    return [self currentUserDictionary];
  }

  NSString *userIdValue = options.userId();
  if (userIdValue != nil) {
    NSString *userId = userIdValue;
    if (userId.length == 0) {
      userId = [[NSUUID UUID] UUIDString];
    }
    [self.defaults setObject:userId forKey:kDefaultsUserIdKey];
  }

  NSString *emailValue = options.email();
  if (emailValue != nil) {
    [self.defaults setObject:emailValue forKey:kDefaultsUserEmailKey];
  }

  NSString *nameValue = options.name();
  if (nameValue != nil) {
    [self.defaults setObject:nameValue forKey:kDefaultsUserNameKey];
  }

  return [self currentUserDictionary];
}

- (NSDictionary *)resetUserData {
  if (!self.isConfigured) {
    RCTLogWarn(@"[Feddy] Attempted to reset user data before configure was called");
    return [self currentUserDictionary];
  }

  [self.defaults removeObjectForKey:kDefaultsUserIdKey];
  [self.defaults removeObjectForKey:kDefaultsUserEmailKey];
  [self.defaults removeObjectForKey:kDefaultsUserNameKey];

  [self ensureUserIdentifier];

  return [self currentUserDictionary];
}

- (NSNumber *)hasPersistentUserData {
  NSString *userId = [self.defaults stringForKey:kDefaultsUserIdKey];
  NSString *email = [self.defaults stringForKey:kDefaultsUserEmailKey];
  NSString *name = [self.defaults stringForKey:kDefaultsUserNameKey];

  BOOL hasData = (userId.length > 0) || (email.length > 0) || (name.length > 0);
  return @(hasData);
}

- (NSDictionary *)getUser {
  return [self currentUserDictionary];
}

- (NSDictionary *)getState {
  return [self currentStateDictionary];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeFeddyReactNativeSpecJSI>(params);
}

@end
