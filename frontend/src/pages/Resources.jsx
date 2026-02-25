import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, Lock, Unlock, AlertTriangle, Clock } from 'lucide-react';
import './Resources.css';

const DURATIONS = [
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: '3 hours', value: 180 },
    { label: '4 hours', value: 240 },
    { label: '6 hours', value: 360 },
    { label: '8 hours', value: 480 },
    { label: '8+ hours', value: 'custom' },
];

const Resources = ({ type }) => {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.role === 'Admin';

    const [resources, setResources] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('Create'); // Create, Edit, Take
    const [activeResource, setActiveResource] = useState(null);

    // Form State
    const [formData, setFormData] = useState({});
    const [selectedDuration, setSelectedDuration] = useState(30);
    const [customDays, setCustomDays] = useState(1);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/resources');
            // Filter by type (Tester or VM)
            setResources(data.filter(r => r.type === type));
        } catch (err) {
            console.error('Failed to fetch resources', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
        setSearch('');
    }, [type]);

    const filteredResources = resources.filter(r => {
        const term = search.toLowerCase();
        return (
            r.name.toLowerCase().includes(term) ||
            r.ipAddress.toLowerCase().includes(term) ||
            r.controller.toLowerCase().includes(term) ||
            r.os.toLowerCase().includes(term) ||
            (r.usedBy?.username || '').toLowerCase().includes(term) ||
            r.state.toLowerCase().includes(term)
        );
    });

    // Action Handlers
    const handleOpenModal = (mode, resource = null) => {
        setModalMode(mode);
        setActiveResource(resource);
        if (mode === 'Create' || mode === 'Request') {
            setFormData({ type, name: '', ipAddress: '', controller: '', os: '', state: 'FREE', purpose: '' });
        } else if (mode === 'Edit') {
            setFormData({ ...resource });
        } else if (mode === 'Take') {
            setFormData({ purpose: '' });
            setSelectedDuration(30);
            setCustomDays(1);
        }
        setIsModalOpen(true);
    };

    const submitForm = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'Create') {
                await api.post('/resources', formData);
            } else if (modalMode === 'Edit') {
                await api.put(`/resources/${activeResource._id}`, formData);
            } else if (modalMode === 'Take') {
                const durationMinutes = selectedDuration === 'custom' ? customDays * 24 * 60 : selectedDuration;
                await api.post(`/resources/${activeResource._id}/take`, { purpose: formData.purpose, duration: durationMinutes });
            } else if (modalMode === 'Request') {
                await api.post('/requests', formData);
                alert('Resource request submitted successfully. Awaiting Admin approval.');
            }
            setIsModalOpen(false);
            fetchResources();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const handleRelease = async (id) => {
        if (!window.confirm('Release this resource?')) return;
        try {
            await api.post(`/resources/${id}/release`);
            fetchResources();
        } catch (err) {
            alert(err.response?.data?.message || 'Release failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Permanently delete this resource?')) return;
        try {
            await api.delete(`/resources/${id}`);
            fetchResources();
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    const setMaintenance = async (id, currentState) => {
        const newState = currentState === 'MAINTENANCE' ? 'FREE' : 'MAINTENANCE';
        try {
            await api.put(`/resources/${id}`, { state: newState });
            fetchResources();
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        }
    };

    const handleUrgentRequest = async (id) => {
        try {
            await api.post(`/resources/${id}/urgent-request`);
            alert('Urgent request notification sent to the current user!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send urgent request');
        }
    };

    const getStatusBadge = (state) => {
        switch (state) {
            case 'FREE': return <span className="status-badge free">Free</span>;
            case 'IN-USE': return <span className="status-badge in-use">In Use</span>;
            case 'MAINTENANCE': return <span className="status-badge maint">Maintenance</span>;
            default: return null;
        }
    };

    return (
        <motion.div
            className="resources-container"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            key={type} // Re-animate on type change
        >
            <div className="resources-header">
                <div>
                    <h2>{type}s Management</h2>
                    <p>View and manage your {type.toLowerCase()} resources</p>
                </div>

                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by any field..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {isAdmin ? (
                        <button className="btn-primary" onClick={() => handleOpenModal('Create')}>
                            <Plus size={18} /> Add {type}
                        </button>
                    ) : (
                        <button className="btn-primary" onClick={() => handleOpenModal('Request')}>
                            <Plus size={18} /> Request {type}
                        </button>
                    )}
                </div>
            </div>

            <div className="table-responsive">
                {loading ? (
                    <div className="table-loader">Loading...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>IP Address</th>
                                <th>Controller</th>
                                <th>OS</th>
                                <th>State</th>
                                <th>Used By / Purpose</th>
                                <th className="th-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filteredResources.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center">No {type}s found.</td></tr>
                                ) : (
                                    filteredResources.map((res, i) => (
                                        <motion.tr
                                            key={res._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2, delay: i * 0.05 }}
                                        >
                                            <td className="fw-500">{res.name}</td>
                                            <td className="text-mono">{res.ipAddress}</td>
                                            <td>{res.controller}</td>
                                            <td>{res.os}</td>
                                            <td>{getStatusBadge(res.state)}</td>
                                            <td>
                                                {res.state === 'IN-USE' && res.usedBy ? (
                                                    <div className="usage-info">
                                                        <span className="used-user">{res.usedBy.username}</span>
                                                        <span className="used-purpose" title={res.purpose}>{res.purpose || 'No purpose'}</span>
                                                        {res.expectedReleaseAt && (
                                                            <span className="used-time">Until: {new Date(res.expectedReleaseAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                        )}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="td-actions">
                                                {res.state === 'FREE' && (
                                                    <button className="btn-action take" onClick={() => handleOpenModal('Take', res)} title="Reserve Resource">
                                                        <Lock size={16} /> Reserve
                                                    </button>
                                                )}
                                                {res.state === 'IN-USE' && (isAdmin || (res.usedBy && (res.usedBy._id === user.userId || res.usedBy === user.userId))) && (
                                                    <button className="btn-action release" onClick={() => handleRelease(res._id)} title="Release Resource">
                                                        <Unlock size={16} /> Release
                                                    </button>
                                                )}

                                                {res.state === 'IN-USE' && res.usedBy && res.usedBy._id !== user.userId && (
                                                    <button className="btn-action warn" onClick={() => handleUrgentRequest(res._id)} title="Send Urgent Request">
                                                        <AlertTriangle size={16} /> Urgent
                                                    </button>
                                                )}

                                                {(isAdmin || (res.state === 'FREE') || (res.state === 'IN-USE' && res.usedBy && res.usedBy._id === user.userId)) && res.state !== 'MAINTENANCE' && (
                                                    <button className="btn-icon edit" onClick={() => handleOpenModal('Edit', res)} title="Edit">
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}

                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            className={`btn-icon ${res.state === 'MAINTENANCE' ? 'warn-active' : 'warn'}`}
                                                            onClick={() => setMaintenance(res._id, res.state)}
                                                            title="Toggle Maintenance"
                                                        >
                                                            <AlertTriangle size={16} />
                                                        </button>
                                                        <button className="btn-icon danger" onClick={() => handleDelete(res._id)} title="Delete">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${modalMode === 'Take' ? 'Reserve' : modalMode} ${type}`}
            >
                <form onSubmit={submitForm} className="modal-form">
                    {modalMode === 'Take' ? (
                        <div className="form-group take-form">
                            <label>Select Duration</label>
                            <div className="duration-grid">
                                {DURATIONS.map(d => (
                                    <button
                                        type="button"
                                        key={d.value}
                                        className={`duration-btn ${selectedDuration === d.value ? 'active' : ''}`}
                                        onClick={() => setSelectedDuration(d.value)}
                                    >
                                        <Clock size={18} className="duration-icon" />
                                        <div className="duration-label">{d.label}</div>
                                        {selectedDuration === d.value && d.value !== 'custom' && (
                                            <div className="duration-until">
                                                Until: {new Date(Date.now() + d.value * 60000).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {selectedDuration === 'custom' && (
                                <div className="form-group custom-days-input" style={{ marginTop: '1rem' }}>
                                    <label>Number of Days</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={customDays}
                                        onChange={(e) => setCustomDays(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <label style={{ marginTop: '1rem' }}>Purpose</label>
                            <textarea
                                value={formData.purpose || ''}
                                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                placeholder="What will you be using this resource for?"
                                rows={2}
                                required
                            />

                            <div className="take-summary">
                                <div className="summary-row">
                                    <span>Selected Duration:</span>
                                    <strong>{selectedDuration === 'custom' ? `${customDays} day(s)` : DURATIONS.find(d => d.value === selectedDuration)?.label}</strong>
                                </div>
                                <div className="summary-row">
                                    <span>Expected Release:</span>
                                    <strong className="text-success">{new Date(Date.now() + (selectedDuration === 'custom' ? customDays * 24 * 60 : selectedDuration) * 60000).toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!isAdmin && modalMode === 'Edit'}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>IP Address</label>
                                <input
                                    type="text"
                                    value={formData.ipAddress || ''}
                                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                                    disabled={!isAdmin && modalMode === 'Edit'}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Controller / Location</label>
                                <input
                                    type="text"
                                    value={formData.controller || ''}
                                    onChange={(e) => setFormData({ ...formData, controller: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>OS / Environment</label>
                                <input
                                    type="text"
                                    value={formData.os || ''}
                                    onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                                    required
                                />
                            </div>

                            {modalMode === 'Request' && (
                                <div className="form-group">
                                    <label>Purpose / Justification</label>
                                    <textarea
                                        value={formData.purpose || ''}
                                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                        placeholder="Why do you need this resource?"
                                        rows={2}
                                        required
                                    />
                                </div>
                            )}
                        </>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn-primary">
                            {modalMode === 'Take' ? 'Confirm Reserve' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Modal>
        </motion.div>
    );
};

export default Resources;
