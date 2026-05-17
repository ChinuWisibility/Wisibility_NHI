import { PublicClientApplication, type Configuration, LogLevel } from '@azure/msal-browser'

export const msalConfig: Configuration = {
  auth: {
    clientId:               import.meta.env.VITE_AZURE_CLIENT_ID,
    authority:              `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri:            import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri:  import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation:          'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error,
      loggerCallback: (level, message, containsPii) => {
        if (containsPii || !import.meta.env.DEV) return
        console.log(`[MSAL] ${LogLevel[level]}: ${message}`)
      },
    },
  },
}

// Scopes requested at login — openid/profile give identity claims; the API scope
// gives an access token the backend APIM JWT policy will validate.
export const loginRequest = {
  scopes: [
    'openid',
    'profile',
    'email',
    `api://${import.meta.env.VITE_AZURE_CLIENT_ID}/NHI.Access`,
  ],
}

const isRealConfig = 
  import.meta.env.VITE_AZURE_CLIENT_ID && 
  import.meta.env.VITE_AZURE_CLIENT_ID !== 'your-id' &&
  import.meta.env.VITE_AZURE_CLIENT_ID.length > 10

const isSecure = typeof window !== 'undefined' && window.isSecureContext

export const msalInstance = (isRealConfig && isSecure)
  ? new PublicClientApplication(msalConfig)
  : null
