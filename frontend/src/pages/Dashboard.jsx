import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Monitor, Activity, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import './Dashboard.css';

const StatCard = ({ title, value, icon, delay }) => (
    <motion.div
        className="stat-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
    >
        <div className="stat-icon">{icon}</div>
        <div className="stat-content">
            <h3>{title}</h3>
            <div className="stat-value">{value}</div>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        total: 0,
        inUse: 0,
        free: 0,
        maintenance: 0,
        routers: 0,
        vms: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/resources');

                const inUse = data.filter(r => r.state === 'IN-USE').length;
                const free = data.filter(r => r.state === 'FREE').length;
                const maintenance = data.filter(r => r.state === 'MAINTENANCE').length;
                const routers = data.filter(r => r.type === 'Tester').length;
                const vms = data.filter(r => r.type === 'VM').length;

                setStats({
                    total: data.length,
                    inUse,
                    free,
                    maintenance,
                    routers,
                    vms
                });
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="page-loader">Loading Dashboard...</div>;

    return (
        <motion.div
            className="dashboard-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="dashboard-header">
                <h2>System Overview</h2>
                <p>Real-time resource utilization</p>
            </div>

            <div className="stats-grid">
                <StatCard
                    title="Total Resources"
                    value={stats.total}
                    icon={<Server size={24} />}
                    delay={0.1}
                />
                <StatCard
                    title="In Use"
                    value={stats.inUse}
                    icon={<Activity size={24} color="var(--warning)" />}
                    delay={0.2}
                />
                <StatCard
                    title="Free"
                    value={stats.free}
                    icon={<Monitor size={24} color="var(--success)" />}
                    delay={0.3}
                />
                <StatCard
                    title="Maintenance"
                    value={stats.maintenance}
                    icon={<ShieldAlert size={24} color="var(--danger)" />}
                    delay={0.4}
                />
            </div>

            <div className="dashboard-charts">
                <motion.div
                    className="chart-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <h3>Device Distribution</h3>
                    <div className="distribution-bar">
                        <div
                            className="dist-segment testers"
                            style={{ width: `${stats.total ? (stats.routers / stats.total) * 100 : 0}%` }}
                            title={`Testers: ${stats.routers}`}
                        ></div>
                        <div
                            className="dist-segment vms"
                            style={{ width: `${stats.total ? (stats.vms / stats.total) * 100 : 0}%` }}
                            title={`VMs: ${stats.vms}`}
                        ></div>
                    </div>
                    <div className="dist-legend">
                        <div className="legend-item"><span className="dot testers"></span> Testers ({stats.routers})</div>
                        <div className="legend-item"><span className="dot vms"></span> VMs ({stats.vms})</div>
                    </div>
                </motion.div>
            </div>

        </motion.div>
    );
};

export default Dashboard;
