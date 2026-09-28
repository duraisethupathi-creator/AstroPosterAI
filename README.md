# AstroPoster AI

Tamil-first AI content and poster studio for astrologers.

## Application foundation
- Expo SDK 57, React Native, TypeScript and Expo Router
- Tamil, English, Hindi, Telugu, Kannada and Malayalam localization
- Premium home dashboard
- Persistent Brand Profile with local image assets
- Typed astrology category flows and category-specific content contracts
- Poster editor foundation
- Settings and built-in AI content generation through a local backend

## Local AI development (Stage 5.1)

The app calls the AstroPoster backend, which validates category requests and uses
an Ollama-compatible local model. No external AI API keys or user provider settings
are required. Mock mode remains available for integration testing.

See [Windows setup and direct generation tests](server/LOCAL_AI.md).
