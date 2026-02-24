
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AIPersona } from './types.ts';

export interface ThemeConfig {
  brandName: string;
  accentColor: string;
  logoPath: string;
  appIconPath: string;
}

const themes: Record<AIPersona, ThemeConfig> = {
  [AIPersona.ARES]: {
    brandName: 'Ares',
    accentColor: '#D4AF37',
    logoPath: 'https://picsum.photos/seed/ares/200/200', // Placeholder
    appIconPath: 'https://picsum.photos/seed/ares-icon/64/64', // Placeholder
  },
  [AIPersona.ATHENA]: {
    brandName: 'Athena',
    accentColor: '#999B9B',
    logoPath: 'https://picsum.photos/seed/athena/200/200', // Placeholder
    appIconPath: 'https://picsum.photos/seed/athena-icon/64/64', // Placeholder
  },
};

interface ThemeContextType {
  persona: AIPersona;
  theme: ThemeConfig;
  setPersona: (persona: AIPersona) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialPersona?: AIPersona }> = ({ children, initialPersona = AIPersona.ARES }) => {
  const [persona, setPersonaState] = useState<AIPersona>(() => {
    const saved = localStorage.getItem('trainer_persona');
    return (saved as AIPersona) || initialPersona;
  });

  const setPersona = (newPersona: AIPersona) => {
    setPersonaState(newPersona);
    localStorage.setItem('trainer_persona', newPersona);
  };

  const theme = themes[persona];

  useEffect(() => {
    // Update CSS variables for global styles
    document.documentElement.style.setProperty('--accent-color', theme.accentColor);
    document.documentElement.style.setProperty('--gold-solid', theme.accentColor); // Keep compatibility with existing styles if needed
    
    // Update document title and favicon if possible
    document.title = `${theme.brandName} | Elite Fitness Protocol`;
    
    // Update apple-mobile-web-app-title
    const metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (metaTitle) metaTitle.setAttribute('content', theme.brandName);

    // Update favicon (if we had real paths, we'd update the link tag)
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ persona, theme, setPersona }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
