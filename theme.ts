export const theme = {
  colors: {
    gold: {
      main: '#D4AF37',
      light: '#FCF6BA',
      dark: '#B38728',
      deep: '#AA771C',
      muted: '#C5A059',
      bronze: '#BF953F',
      veryLight: '#FBF5B7',
    },
    background: {
      main: '#050505',
      pure: '#000000',
    },
    surface: {
      main: '#080809',
      light: '#0c0c0e',
      card: '#0A0A0B',
      dark: '#121214',
    },
    text: {
      main: '#FFFFFF',
      muted: '#888888',
      dim: '#666666',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.05)',
      gold: 'rgba(212, 175, 55, 0.12)',
    }
  }
};

export type AppTheme = typeof theme;
