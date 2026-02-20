# Google Maps Places API Setup

## Overview
The address autocomplete feature uses Google Maps Places API to provide address suggestions as users type. This ensures addresses are formatted correctly and validated.

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API**:
   - Navigate to **APIs & Services** → **Library**
   - Search for "Places API"
   - Click **Enable**
4. Create an API Key:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy the API key

### 2. Restrict API Key (Recommended for Security)

1. Click on your API key to edit it
2. Under **API restrictions**, select "Restrict key"
3. Select **Places API** from the list
4. Under **Application restrictions**, choose:
   - **HTTP referrers (web sites)** for production
   - Add your domain(s): `https://your-domain.com/*`
   - For local development: `http://localhost:*`

### 3. Add API Key to Environment Variables

Add to your `.env` file:

```env
VITE_GOOGLE_MAPS_API_KEY=your-api-key-here
```

**Important:** 
- Never commit the `.env` file with real API keys
- Use `.env.local` for local development (should be in `.gitignore`)
- For production, set environment variables in your hosting platform

### 4. Verify Setup

1. Start your development server: `npm run dev`
2. Navigate to lawyer onboarding or dashboard
3. Go to the "Business Address" field
4. Start typing an address
5. You should see autocomplete suggestions appear

## Features

- **Automatic suggestions** as you type
- **Restricted to New York addresses** (US + NY state)
- **Standardized formatting** - addresses are formatted correctly
- **Validation** - ensures addresses are valid

## Cost Considerations

Google Maps Places API has usage-based pricing:
- **Autocomplete session**: $0.017 per session (first autocomplete per address)
- **Free tier**: $200/month credit (covers ~11,700 autocomplete sessions)

For most applications, this should be well within free tier limits.

## Troubleshooting

### "Address autocomplete will not work" warning
- Check that `VITE_GOOGLE_MAPS_API_KEY` is set in your `.env` file
- Restart your dev server after adding the key

### "Failed to load Google Maps API"
- Verify your API key is correct
- Check that Places API is enabled in Google Cloud Console
- Check browser console for specific error messages

### No suggestions appearing
- Check API key restrictions allow your domain
- Verify Places API is enabled
- Check browser console for API errors

## Alternative Solutions

If you prefer not to use Google Maps API, alternatives include:
- **Mapbox Geocoding API** - Similar functionality
- **Here API** - Geocoding and autocomplete
- **OpenStreetMap Nominatim** - Free but less accurate

The current implementation uses Google Maps Places API for best accuracy and user experience.

