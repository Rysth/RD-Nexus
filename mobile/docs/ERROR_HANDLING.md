# OTP Error Handling Implementation

This document describes the comprehensive error handling and user feedback system implemented for OTP authentication in the mobile app.

## Overview

The error handling system provides:

- **Specific error categorization** for different failure scenarios
- **Enhanced toast notifications** with contextual messages
- **Visual indicators** for loading, success, and error states
- **Network error handling** with retry suggestions
- **Proper error recovery flows** with user guidance

## Components

### 1. Error Handler Utility (`utils/otpErrorHandler.ts`)

Provides comprehensive error categorization and handling:

```typescript
interface OtpError {
  type:
    | "network"
    | "validation"
    | "authentication"
    | "rate_limit"
    | "server"
    | "unknown";
  message: string;
  canRetry: boolean;
  shouldClearInput: boolean;
  suggestedAction?: string;
}
```

**Key Functions:**

- `handleOtpError()` - Main error handler with categorization
- `shouldClearOtpInput()` - Determines if input should be cleared
- `canRetryOperation()` - Determines if operation can be retried

### 2. Toast Notifications (`utils/toastNotifications.ts`)

Enhanced toast system with operation-specific messaging:

```typescript
// OTP-specific success messages
ToastNotifications.otpSuccess("verify"); // ✅ Código verificado correctamente
ToastNotifications.otpSuccess("resend"); // 📧 Código reenviado exitosamente

// OTP-specific error messages with context
ToastNotifications.otpError("verify", "network"); // 🌐 Sin conexión...
ToastNotifications.otpError("verify", "validation"); // ❌ Código inválido...
```

### 3. Error Recovery Component (`components/ErrorRecovery.tsx`)

Visual error recovery interface with contextual actions:

```typescript
<ErrorRecovery
  error={otpError}
  onRetry={() => handleRetry()}
  onGoBack={() => handleGoBack()}
  onContactSupport={() => handleSupport()}
/>
```

**Features:**

- Error-type specific icons and colors
- Contextual action buttons
- Suggested recovery actions

### 4. Loading Indicator (`components/LoadingIndicator.tsx`)

Enhanced loading states with operation context:

```typescript
<LoadingIndicator operation="verify" />   // Verificando código...
<LoadingIndicator operation="resend" />   // Reenviando código...
<LoadingIndicator operation="login" />    // Iniciando sesión...
```

## Error Categories

### Network Errors

- **Type**: `network`
- **Trigger**: No response from server
- **Behavior**: Keep input, allow retry, show connection hint
- **Message**: "Sin conexión. Verifica tu internet..."

### Validation Errors

- **Type**: `validation`
- **Trigger**: 422 status code, invalid/expired codes
- **Behavior**: Clear input, allow retry, focus first field
- **Message**: "Código inválido o expirado..."

### Authentication Errors

- **Type**: `authentication`
- **Trigger**: 401 status code, session expired
- **Behavior**: Clear input, redirect to login
- **Message**: "Sesión expirada. Inicia sesión nuevamente..."

### Rate Limiting

- **Type**: `rate_limit`
- **Trigger**: 429 status code, too many requests
- **Behavior**: Keep input, disable retry temporarily
- **Message**: "Demasiados intentos. Espera antes de continuar..."

### Server Errors

- **Type**: `server`
- **Trigger**: 5xx status codes
- **Behavior**: Keep input, allow retry with backoff
- **Message**: "Error del servidor. Intenta en unos momentos..."

## Visual Feedback

### Loading States

- **Verification**: Spinner + "Verificando código..."
- **Resend**: Spinner + "Reenviando código..."
- **Success**: Checkmark + "Código verificado correctamente"

### Error States

- **Input Fields**: Red border and background for invalid codes
- **Shake Animation**: Visual feedback for validation errors
- **Error Messages**: Contextual icons and colors by error type

### Success States

- **Input Fields**: Green border and background
- **Success Message**: Checkmark icon with confirmation
- **Toast**: Success notification with emoji

## Retry Mechanism

### Network Failures

- **Max Retries**: 2 attempts
- **Backoff**: Exponential (1s, 2s)
- **Scope**: Only for network/server errors (5xx)

### User-Initiated Retries

- **Resend Button**: Disabled during cooldown
- **Back Navigation**: Clears state and returns to login
- **Input Clearing**: Automatic for validation errors

## Integration

### Auth Store Integration

```typescript
// Enhanced state
interface AuthState {
  otpError: OtpError | null;
  retryCount: number;
  // ... existing state
}

// Enhanced actions
verifyOtp: async (code: string) => {
  const otpError = handleOtpError(error, { operation: "verify" });
  set({ otpError, error: otpError.message });
};
```

### Component Integration

```typescript
// OtpInput component
<OtpInput
  canRetry={otpError?.canRetry ?? true}
  shouldClearInput={otpError?.shouldClearInput ?? false}
  retryCount={retryCount}
  // ... other props
/>
```

## Testing

### Unit Tests

- Error categorization logic
- Input clearing behavior
- Retry mechanism validation
- Toast notification triggering

### Integration Tests

- Complete error flow testing
- Network failure simulation
- User interaction scenarios

## Best Practices

### Error Messages

- Use Spanish language consistently
- Include emojis for better visual recognition
- Provide actionable guidance
- Keep messages concise but informative

### User Experience

- Never leave users without feedback
- Provide clear recovery paths
- Maintain input state for network errors
- Use visual cues (colors, icons, animations)

### Performance

- Debounce retry attempts
- Clear error state on success
- Minimize re-renders during error states
- Use efficient animation libraries

## Future Enhancements

1. **Offline Support**: Handle offline scenarios
2. **Error Analytics**: Track error patterns for improvement
3. **Accessibility**: Enhanced screen reader support
4. **Internationalization**: Multi-language error messages
5. **Advanced Recovery**: Smart retry strategies based on error patterns
