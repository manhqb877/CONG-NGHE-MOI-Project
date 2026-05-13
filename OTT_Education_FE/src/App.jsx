import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import Home from './Pages/Home';
import Login from './Pages/Login';
import ContactsManagement from './Pages/ContactsManagement';
import StatisticsPage from './Pages/StatisticsPage';
import { ottEducationTheme } from './theme/theme';

function App() {
    // Lấy userId và accessToken từ localStorage
    const userId = localStorage.getItem('userId');
    const accessToken = localStorage.getItem('accessToken');

    return (
        <ThemeProvider theme={ottEducationTheme}>
            <CssBaseline />
            <Router>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/home" element={<Home userId={userId} />} />
                    <Route path="/contacts" element={<ContactsManagement />} />
                    <Route path="/statistics" element={<StatisticsPage />} />
                </Routes>

            </Router>
        </ThemeProvider>
    );
}

export default App;
