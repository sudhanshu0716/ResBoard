import React, { useContext, useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Server, Monitor, Bell, Check, FileText, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import './Layout.css';

const Layout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.body.className = theme === 'light' ? 'light-theme' : '';
        localStorage.setItem('theme', theme);
    }, [theme]);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (e) {
            console.error(e);
        }
    };

    const clearAll = async () => {
        try {
            await api.delete('/notifications/all');
            fetchNotifications();
        } catch (e) {
            console.error(e);
        }
    };

    const navItems = [
        { to: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
        { to: '/testers', label: 'Testers', icon: <Monitor size={18} /> },
        { to: '/vms', label: 'Virtual Machines', icon: <Server size={18} /> },
    ];

    if (user?.role === 'Admin') {
        navItems.push({ to: '/logs', label: 'Logs', icon: <FileText size={18} /> });
    }

    return (
        <div className="layout-container">
            <header className="navbar">
                <div className="navbar-brand">
                    <div className="logo-icon">R</div>
                    <h1>ResBoard</h1>
                </div>

                <nav className="nav-tabs">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="navbar-user">

                    <button
                        className="btn-icon theme-btn"
                        onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className="notification-wrapper">
                        <button className="btn-icon bell-btn" onClick={() => setShowNotifications(!showNotifications)}>
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    className="notification-dropdown"
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="notif-header">
                                        <h4>Notifications</h4>
                                        {notifications.length > 0 && (
                                            <button className="btn-text small" onClick={clearAll}>Clear All</button>
                                        )}
                                    </div>
                                    <div className="notif-body">
                                        {notifications.length === 0 ? (
                                            <div className="notif-empty">No notifications</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n._id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                                                    <div className="notif-content">
                                                        <span className="notif-sender">{n.sender?.username}</span>
                                                        <p>{n.message}</p>
                                                        <small>{new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</small>
                                                    </div>
                                                    {!n.read && (
                                                        <button className="btn-icon small text-success" onClick={() => markAsRead(n._id)} title="Mark as Read">
                                                            <Check size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="user-info">
                        <span className="username">{user?.username}</span>
                        <span className="badge">{user?.role}</span>
                    </div>
                    <button onClick={handleLogout} className="btn-logout" title="Log Out">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
