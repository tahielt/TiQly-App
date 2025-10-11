export const colors = {
  primary: '#6200EE',
  primaryVariant: '#3700B3',
  secondary: '#03DAC6',
  secondaryVariant: '#018786',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  error: '#B00020',
  onPrimary: '#FFFFFF',
  onSecondary: '#000000',
  onBackground: '#000000',
  onSurface: '#000000',
  onError: '#FFFFFF',
  text: '#000000',
  textSecondary: '#757575',
  border: '#E0E0E0',
  disabled: '#9E9E9E',
  placeholder: '#9E9E9E',
  backdrop: 'rgba(0, 0, 0, 0.5)',
};

export const spacing = {
  none: 0,
  xsmall: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 48,
} as const;

export const typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 'bold',
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 'bold',
  },
  h5: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 'bold',
  },
  h6: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 'bold',
  },
  subtitle1: {
    fontSize: 16,
    lineHeight: 24,
  },
  subtitle2: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  body1: {
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.25,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
} as const;

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
} as const;
