import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

const darkTheme = {
  dark: true,
  colors: {
    primary: '#9a66e3', // Purpleish
    secondary: '#FFD700', // Gold
    accent: '#9C27B0', // Purple accent
    background: '#0F0F1E', // Very dark blue-black
    surface: '#1A1A2E', // Glass surface base
    'surface-variant': '#16213E', // Surface variant
    'surface-bright': '#1A1A2E', // Bright surface
    'on-surface': '#FFFFFF', // Text on surface
    'glass-surface': '#2d284d', // Main glass color
    'glass-border': '#FFFFFF', // Glass border color
  },
}

const lightTheme = {
  dark: false,
  colors: {
    primary: '#6200EA', // Deep purple
    secondary: '#FF6F00', // Orange
    accent: '#00BFA5', // Teal accent
    background: '#F5F5F5', // Light gray
    surface: '#FFFFFF', // White surface
    'surface-variant': '#E0E0E0', // Light surface variant
    'surface-bright': '#FAFAFA', // Bright surface
    'on-surface': '#000000', // Text on surface
    'glass-surface': '#FFFFFF', // Main glass color for light theme
    'glass-border': '#000000', // Glass border color for light theme
  },
}

// Dark Forest - Nature inspired dark theme
const darkForestTheme = {
  dark: true,
  colors: {
    primary: '#4CAF50', // Forest green
    secondary: '#8BC34A', // Light green
    accent: '#00E676', // Bright green accent
    background: '#0A1F0A', // Very dark green-black
    surface: '#1B2F1B', // Dark green surface
    'surface-variant': '#2A3F2A', // Green surface variant
    'surface-bright': '#1B2F1B', // Bright surface
    'on-surface': '#E8F5E9', // Light green text
    'glass-surface': '#1B2F1B', // Main glass color
    'glass-border': '#4CAF50', // Green border
  },
}

// Deep Blue - Ocean inspired dark theme
const deepBlueTheme = {
  dark: true,
  colors: {
    primary: '#2196F3', // Ocean blue
    secondary: '#00BCD4', // Cyan
    accent: '#00E5FF', // Bright cyan accent
    background: '#0A1929', // Very dark blue-black
    surface: '#1A2F42', // Dark blue surface
    'surface-variant': '#2A3F52', // Blue surface variant
    'surface-bright': '#1A2F42', // Bright surface
    'on-surface': '#E3F2FD', // Light blue text
    'glass-surface': '#1A2F42', // Main glass color
    'glass-border': '#2196F3', // Blue border
  },
}

// Crimson - Intense red theme
const crimsonTheme = {
  dark: true,
  colors: {
    primary: '#DC143C', // Crimson red
    secondary: '#FFD700', // Gold
    accent: '#FF1744', // Bright red accent
    background: '#1A0A0A', // Very dark red-black
    surface: '#2A1A1A', // Dark red surface
    'surface-variant': '#3A1A1A', // Red surface variant
    'surface-bright': '#2A1A1A', // Bright surface
    'on-surface': '#FFFFFF', // Text on surface
    'glass-surface': '#2A1A1A', // Main glass color
    'glass-border': '#DC143C', // Red border
  },
}

// Papyrus - Warm beige/tan light theme
const papyrusTheme = {
  dark: false,
  colors: {
    primary: '#8D6E63', // Warm brown
    secondary: '#D7CCC8', // Light tan
    accent: '#6D4C41', // Dark brown accent
    background: '#F5F3E7', // Papyrus beige
    surface: '#FFF9E6', // Cream surface
    'surface-variant': '#EFE9D6', // Tan surface variant
    'surface-bright': '#FFFBF0', // Bright surface
    'on-surface': '#3E2723', // Dark brown text
    'glass-surface': '#FFF9E6', // Main glass color
    'glass-border': '#8D6E63', // Brown border
  },
}

// Mint - Fresh green light theme
const mintTheme = {
  dark: false,
  colors: {
    primary: '#00897B', // Teal
    secondary: '#26A69A', // Light teal
    accent: '#00695C', // Dark teal accent
    background: '#E0F2F1', // Mint background
    surface: '#F1F8F6', // Light mint surface
    'surface-variant': '#B2DFDB', // Mint surface variant
    'surface-bright': '#FFFFFF', // Bright surface
    'on-surface': '#004D40', // Dark teal text
    'glass-surface': '#F1F8F6', // Main glass color
    'glass-border': '#00897B', // Teal border
  },
}

// Sunset - Warm orange/pink light theme
const sunsetTheme = {
  dark: false,
  colors: {
    primary: '#FF6F00', // Orange
    secondary: '#FF9800', // Light orange
    accent: '#F4511E', // Red-orange accent
    background: '#FFF3E0', // Warm cream background
    surface: '#FFF8F0', // Light peach surface
    'surface-variant': '#FFE0B2', // Orange surface variant
    'surface-bright': '#FFFAF5', // Bright surface
    'on-surface': '#E65100', // Dark orange text
    'glass-surface': '#FFF8F0', // Main glass color
    'glass-border': '#FF6F00', // Orange border
  },
}

// Midnight - Deep purple/blue dark theme
const midnightTheme = {
  dark: true,
  colors: {
    primary: '#7C4DFF', // Purple
    secondary: '#536DFE', // Indigo
    accent: '#B388FF', // Light purple accent
    background: '#0D0A1F', // Very dark purple-black
    surface: '#1A162F', // Dark purple surface
    'surface-variant': '#2A264F', // Purple surface variant
    'surface-bright': '#1A162F', // Bright surface
    'on-surface': '#E8E4F3', // Light purple text
    'glass-surface': '#1A162F', // Main glass color
    'glass-border': '#7C4DFF', // Purple border
  },
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'darkTheme',
    themes: {
      darkTheme,
      lightTheme,
      darkForestTheme,
      deepBlueTheme,
      crimsonTheme,
      papyrusTheme,
      mintTheme,
      sunsetTheme,
      midnightTheme,
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  defaults: {
    VCard: {
      class: 'glass-card',
    },
    VBtn: {
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
    },
  },
})





