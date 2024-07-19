import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import AddNotes from './AddNotes';
import { fetchCalls, archiveCall } from '../services/calls';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CallList = () => {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [selectedCall, setSelectedCall] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedCalls, setSelectedCalls] = useState([]);
    const [groupByDate, setGroupByDate] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const itemsPerPage = 10;

    const fetchCallsData = async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const offset = (page - 1) * itemsPerPage;
            const response = await fetchCalls(offset, itemsPerPage);
            setCalls(response.nodes);
            setTotalPages(Math.ceil(response.totalCount / itemsPerPage));
            setHasNextPage(response.hasNextPage);
        } catch (error) {
            setError('Unable to load calls.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCallsData(currentPage);
    }, [currentPage]);

    useEffect(() => {
        if (filter === 'Archived') {
            setCalls(calls.filter(call => !call.is_archived));
        } else if (filter === 'Unarchived') {
            setCalls(calls.filter(call => call.is_archived));
        } else {
            fetchCallsData(currentPage);
        }
    }, [filter, currentPage]);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const handleCallDetails = (call) => {
        setSelectedCall(call);
        setShowModal(true);
    };

    const handleToggleArchive = async (callId, isArchived) => {
        try {
            await archiveCall(callId);
            const updatedCalls = calls.map(call =>
                call.id === callId ? { ...call, is_archived: !isArchived } : call
            );
            setCalls(updatedCalls);
        } catch (error) {
            console.error(`Failed to ${isArchived ? 'unarchive' : 'archive'} call`, error);
        }
    };

    const handleToggleArchiveMultiple = async () => {
        try {
            await Promise.all(selectedCalls.map(callId => archiveCall(callId)));
            const updatedCalls = calls.map(call =>
                selectedCalls.includes(call.id) ? { ...call, is_archived: !call.is_archived } : call
            );
            setCalls(updatedCalls);
            setSelectedCalls([]);
        } catch (error) {
            console.error('Failed to update selected calls', error);
        }
    };

    const handleSelectCall = (callId) => {
        setSelectedCalls(prev => prev.includes(callId)
            ? prev.filter(id => id !== callId)
            : [...prev, callId]
        );
    };

    const formatDuration = (duration) => {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes} min ${seconds} sec (${duration} sec)`;
    };

    const formatCallDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const organizeCallsByDate = (calls) => {
        const sortedCalls = [...calls].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return sortedCalls.reduce((acc, call) => {
            const date = new Date(call.created_at).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(call);
            return acc;
        }, {});
    };

    const callsGrouped = groupByDate ? organizeCallsByDate(calls) : { '': calls };

    const renderStatusButton = (call) => (
        call.is_archived ? (
            <Button variant="outline-success" size="sm" onClick={() => handleToggleArchive(call.id, call.is_archived)}>Unarchive</Button>
        ) : (
            <Button variant="outline-secondary" size="sm" onClick={() => handleToggleArchive(call.id, call.is_archived)}>Archive</Button>
        )
    );

    const renderCallType = (type, call) => {
        const className = {
            voicemail: 'text-primary',
            answered: 'text-success',
            missed: 'text-danger'
        }[type] || '';
        return (
            <span className={className} onClick={() => handleCallDetails(call)}>
                {type}
            </span>
        );
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="container">
            <h2 className="my-4">Call List</h2>
            <div className="d-flex justify-content-between mb-3">
                <div>
                    <label>Filter:</label>
                    <select
                        className="form-control d-inline-block ml-2"
                        style={{ width: 'auto' }}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="">All</option>
                        <option value="Archived">Archived</option>
                        <option value="Unarchived">Unarchived</option>
                    </select>
                </div>
                <div className="d-flex align-items-center">
                    <DatePicker
                        selected={startDate}
                        onChange={date => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        placeholderText="Start Date"
                        className="form-control"
                    />
                    <DatePicker
                        selected={endDate}
                        onChange={date => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        placeholderText="End Date"
                        className="form-control ml-2"
                    />
                    <Button variant="primary" className="ml-2" onClick={() => fetchCallsData(currentPage)}>
                        Apply Date Filter
                    </Button>
                </div>
                <Button variant="secondary" onClick={() => setGroupByDate(!groupByDate)}>
                    {groupByDate ? 'Ungroup Calls' : 'Group Calls by Date'}
                </Button>
                <Button variant="danger" onClick={handleToggleArchiveMultiple}>
                    Toggle Archive for Selected
                </Button>
            </div>
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Select</th>
                        <th>Type</th>
                        <th>Direction</th>
                        <th>Duration</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Via</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(callsGrouped).map(([date, callsForDate]) => (
                        <React.Fragment key={date}>
                            {date && <tr><td colSpan="10" className="bg-light font-weight-bold">{date}</td></tr>}
                            {callsForDate.map(call => (
                                <tr key={call.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedCalls.includes(call.id)}
                                            onChange={() => handleSelectCall(call.id)}
                                        />
                                    </td>
                                    <td>{renderCallType(call.call_type, call)}</td>
                                    <td className="text-primary">{call.direction}</td>
                                    <td>{formatDuration(call.duration)}</td>
                                    <td>{call.from}</td>
                                    <td>{call.to}</td>
                                    <td>{call.via}</td>
                                    <td>{formatCallDate(call.created_at)}</td>
                                    <td>{renderStatusButton(call)}</td>
                                    <td>
                                        <Button variant="primary" size="sm" onClick={() => handleCallDetails(call)}>Add Note</Button>
                                    </td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
            <nav className="mt-3">
                <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <Button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>Previous</Button>
                    </li>
                    {[...Array(totalPages).keys()].map(number => (
                        <li key={number + 1} className={`page-item ${number + 1 === currentPage ? 'active' : ''}`}>
                            <Button className="page-link" onClick={() => handlePageChange(number + 1)}>{number + 1}</Button>
                        </li>
                    ))}
                    <li className={`page-item ${!hasNextPage ? 'disabled' : ''}`}>
                        <Button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>Next</Button>
                    </li>
                </ul>
            </nav>
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Notes 
                   
                    {selectedCall && <p style={{ color: 'blue', fontWeight: '100' }}>Call ID: {selectedCall.id}</p>}
                     </Modal.Title>
                    
                </Modal.Header>
                <Modal.Body>
                    {selectedCall && <AddNotes call={selectedCall} />}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CallList;
