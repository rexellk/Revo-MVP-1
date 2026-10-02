// REVO design tokens. Colors sampled directly from the REVO pitch deck.
export const colors = {
  // Backgrounds of the deck: navy gradient left to right
  navyDeep: '#101B3B',
  navyRoyal: '#243472',
  navy: '#1A2757', // midpoint, used for solid navy cards
  ink: '#0E0F39', // the "R" in the logo mark, primary text
  bg: '#FFFFFF', // screens, top bar, tab bar, footers, sheets, modals
  surface: '#F7F6EF', // warm off-white fill for grouped rows and incoming chat bubbles
  cream: '#FFFCD7', // brand accent: logo tile, text and buttons on navy
  creamSoft: '#FDFAD5',
  creamDeep: '#F3EDC0', // accent fills: tags, chips, safety banner, switch pill
  brick: '#861A13', // logo tag, team pills, primary accent
  brickDark: '#6A140E',
  white: '#FFFFFF',
  muted: '#5C5F7E', // secondary text on white
  placeholder: 'rgba(92,95,126,0.5)',
  mutedOnNavy: 'rgba(255,252,215,0.72)',
  line: 'rgba(14,15,57,0.10)',
  lineOnNavy: 'rgba(255,252,215,0.18)',
  success: '#2F7D4F', // "online" dot only
  overlay: 'rgba(16,27,59,0.55)',
} as const;

export const gradient = {
  navy: [colors.navyDeep, colors.navyRoyal] as const,
};

export const fonts = {
  display: 'KronaOne_400Regular', // wide display face, closest Google match to the deck headlines
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extrabold: 'Archivo_800ExtraBold',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

export const shadow = {
  card: {
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
