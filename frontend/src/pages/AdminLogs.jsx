import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import api from '../services/api';
import './AdminLogs.css';
import { FileText, Users, Activity, BarChart2 } from 'lucide-react';

const AdminLogs = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [insights, setInsights] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role !== 'Admin') return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [logsRes, insightsRes, reqsRes] = await Promise.all([
                    api.get('/logs'),
                    api.get('/logs/insights'),
                    api.get('/requests')
                ]);
                setLogs(logsRes.data);
                setInsights(insightsRes.data);
                setPendingRequests(reqsRes.data);
            } catch (error) {
                console.error('Failed to fetch admin data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000); // refresh every minute
        return () => clearInterval(interval);
    }, [user]);

    if (user?.role !== 'Admin') {
        return <div className="resources-container"><h2>Unauthorized Access</h2></div>;
    }

    if (loading && !insights) {
        return <div className="table-loader">Loading Logs & Insights...</div>;
    }

    const handleRequestAction = async (id, action) => {
        try {
            await api.put(`/requests/${id}/${action}`);
            const { data } = await api.get('/requests');
            setPendingRequests(data);
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${action} request`);
        }
    };

    const formatAction = (action) => {
        switch (action) {
            case 'TAKE': return <span className="action-badge take">TAKE</span>;
            case 'RELEASE': return <span className="action-badge release">RELEASE</span>;
            case 'MAINTENANCE_START': return <span className="action-badge maint">MAINTENANCE START</span>;
            case 'MAINTENANCE_END': return <span className="action-badge maint-end">MAINTENANCE END</span>;
            default: return action;
        }
    };

    return (
        <motion.div
            className="admin-logs-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="logs-header">
                <div>
                    <h2>Admin Logs & Insights</h2>
                    <p>Track all resource usage history and analytics</p>
                </div>
            </div>

            {insights && (
                <div className="insights-grid">
                    <div className="insight-card highlight">
                        <div className="insight-icon"><Activity size={24} /></div>
                        <div className="insight-content">
                            <h3>Current Utilization</h3>
                            <div className="stat-value">
                                {insights.liveStats.inUse} / {insights.liveStats.total}
                            </div>
                            <p className="stat-label">Resources actively in use</p>
                        </div>
                    </div>

                    <div className="insight-card">
                        <div className="insight-icon"><Users size={24} /></div>
                        <div className="insight-content">
                            <h3>Top Active Users</h3>
                            <ul className="leaderboard">
                                {insights.activeUsers.length === 0 ? <li>No activity yet</li> :
                                    insights.activeUsers.map((u, i) => (
                                        <li key={i}>
                                            <span className="name">{u.username}</span>
                                            <span className="count">{u.takes} requests</span>
                                        </li>
                                    ))
                                }
                            </ul>
                        </div>
                    </div>

                    <div className="insight-card">
                        <div className="insight-icon"><BarChart2 size={24} /></div>
                        <div className="insight-content">
                            <h3>Most Requested Resources</h3>
                            <ul className="leaderboard">
                                {insights.usedResources.length === 0 ? <li>No activity yet</li> :
                                    insights.usedResources.map((r, i) => (
                                        <li key={i}>
                                            <span className="name">{r.resourceName}</span>
                                            <span className="count">{r.takes} times</span>
                                        </li>
                                    ))
                                }
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {pendingRequests.length > 0 && (
                <div className="table-responsive" style={{ marginBottom: '2rem', border: '2px solid var(--accent-primary)' }}>
                    <div className="table-header">
                        <h3 className="text-warning"><Activity size={18} /> Pending Resource Requests ({pendingRequests.length})</h3>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Name</th>
                                <th>Requested By</th>
                                <th>Purpose</th>
                                <th className="th-actions">Decision</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingRequests.map(req => (
                                <tr key={req._id}>
                                    <td><strong>{req.type}</strong></td>
                                    <td>{req.name}</td>
                                    <td>{req.requestedBy?.username || 'Unknown'}</td>
                                    <td>{req.purpose}</td>
                                    <td className="td-actions" style={{ gap: '0.5rem' }}>
                                        <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleRequestAction(req._id, 'approve')}>
                                            Approve
                                        </button>
                                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleRequestAction(req._id, 'reject')}>
                                            Decline
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="table-responsive">
                <div className="table-header">
                    <h3><FileText size={18} /> Event Log History</h3>
                </div>
                <table className="data-table log-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Resource</th>
                            <th>Purpose / Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr><td colSpan="5" className="text-center">No logs recorded yet.</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log._id}>
                                    <td className="log-time">{new Date(log.createdAt).toLocaleString()}</td>
                                    <td className="fw-500">{log.user?.username || 'Unknown'}</td>
                                    <td>{formatAction(log.action)}</td>
                                    <td className="text-mono">{log.resourceName}</td>
                                    <td className="log-purpose">
                                        {log.purpose}
                                        {log.durationRequested && <span className="log-duration"> (Duration: {log.durationRequested >= 1440 ? `${log.durationRequested / 1440} days` : `${log.durationRequested} mins`})</span>}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default AdminLogs;
