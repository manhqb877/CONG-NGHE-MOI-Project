import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#0068ff',
            light: '#4d96ff',
            dark: '#0051cc',
        },
        secondary: {
            main: '#00aeff',
            light: '#4dcfff',
            dark: '#0089cc',
        },
        background: {
            default: '#f0f2f5',
            paper: '#ffffff',
        },
        text: {
            primary: '#333333',
            secondary: '#666666',
        },
        divider: 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
        fontFamily: "'Roboto', 'Helvetica Neue', 'Arial', sans-serif",
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500 },
    },
    shape: { borderRadius: 8 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                },
            },
        },
    },
});

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#0068ff',
            light: '#4d96ff',
            dark: '#0051cc',
        },
        secondary: {
            main: '#00aeff',
            light: '#4dcfff',
            dark: '#0089cc',
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
        text: {
            primary: '#e0e0e0',
            secondary: '#aaaaaa',
        },
        divider: 'rgba(255, 255, 255, 0.12)',
    },
    typography: {
        fontFamily: "'Roboto', 'Helvetica Neue', 'Arial', sans-serif",
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500 },
    },
    shape: { borderRadius: 8 },
});

export const ottEducationTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#0068ff',
            light: '#4d96ff',
            dark: '#0051cc',
        },
        secondary: {
            main: '#00aeff',
            light: '#4dcfff',
            dark: '#0089cc',
        },
        background: {
            default: '#f0f2f5',
            paper: '#ffffff',
        },
        text: {
            primary: '#081c36',
            secondary: '#7589a3',
        },
        divider: 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
        fontFamily: "'Roboto', 'Helvetica Neue', 'Arial', sans-serif",
        h5: { fontWeight: 700 },
        h6: { fontWeight: 700 },
        subtitle1: { fontWeight: 600 },
        button: { fontWeight: 500 },
        body1: { fontSize: '0.9375rem' },
        body2: { fontSize: '0.8125rem' },
    },
    shape: { borderRadius: 8 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                    fontWeight: 500,
                    boxShadow: 'none',
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 2px 6px rgba(0,104,255,0.25)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                rounded: { borderRadius: 12 },
                elevation1: {
                    boxShadow: '0px 1px 4px rgba(0,0,0,0.1)',
                },
            },
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    border: 'none',
                },
            },
        },
        MuiListItem: {
            styleOverrides: {
                root: {
                    paddingTop: 6,
                    paddingBottom: 6,
                },
            },
        },
    },
});

export default ottEducationTheme;
