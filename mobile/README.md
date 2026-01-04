# Mobile App (Expo + React Native)

This is the mobile application built with Expo and React Native, using the same Rails backend as the web client.

## Prerequisites

- Node.js (LTS)
- Bun (package manager)
- Expo Go app on your mobile device (for testing)
- Android Emulator or iOS Simulator (optional)

## Setup

1. **Install dependencies:**
   ```bash
   cd mobile
   bun install
   ```

2. **Start the backend services:**
   The mobile app connects to the same Rails backend. Make sure your backend is running:
   ```bash
   # From the project root
   ./setup.sh
   ```

3. **Configure API URL (if needed):**
   - **Android Emulator**: Automatically uses `http://10.0.2.2:3000`
   - **iOS Simulator**: Automatically uses `http://localhost:3000`
   - **Physical Device**: Get your computer's local IP:
     ```bash
     # On Linux/Mac:
     ip addr show | grep "inet " | grep -v 127.0.0.1
     # Or on Mac:
     ipconfig getifaddr en0
     ```
     Then update `mobile/utils/api.ts` with your IP (e.g., `http://192.168.1.100:3000`)

## Running the App

```bash
cd mobile
bun start
```

Then:
- Scan the QR code with Expo Go app (Android/iOS)
- Press `a` for Android Emulator
- Press `i` for iOS Simulator

## Project Structure

```
mobile/
├── components/       # Reusable UI components (Button, Input)
├── layouts/          # Layout components (RootLayout, AuthLayout)
├── pages/            # Screen components
│   ├── auth/         # Authentication screens (SignIn, SignUp)
│   └── Home.tsx      # Home screen
├── stores/           # Zustand state management
├── types/            # TypeScript type definitions
├── utils/            # Utilities (API client, helpers)
├── App.tsx           # Main app component
└── global.css        # Tailwind CSS styles
```

## Tech Stack

- **Expo** - React Native framework
- **TypeScript** - Type safety
- **NativeWind** - Tailwind CSS for React Native
- **React Navigation** - Navigation
- **Zustand** - State management
- **Axios** - HTTP client
- **AsyncStorage** - Local storage
- **Expo Vector Icons** - Icon library (Ionicons)

## Development Notes

### Connecting to Local Backend

The app automatically detects the platform and uses the appropriate URL:
- Android Emulator: `10.0.2.2:3000` (maps to localhost on host)
- iOS Simulator: `localhost:3000`
- Physical devices: Use your computer's local IP address

Make sure your backend is running and accessible from your device's network.

### Clearing Cache

If you encounter issues:
```bash
bun start --clear
```

## Available Scripts

- `bun start` - Start Expo development server
- `bun android` - Open on Android emulator
- `bun ios` - Open on iOS simulator
- `bun web` - Open in web browser
