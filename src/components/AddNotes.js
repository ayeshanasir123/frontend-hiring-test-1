import React, { useEffect, useState } from 'react';
import axiosInstance from '../Utlis/axiosConfig';

const CallDetails = ({ call }) => {
    const [noteContent, setNoteContent] = useState('');
    const [callInfo, setCallInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const loadCallDetails = async () => {
            try {
                const { data } = await axiosInstance.get(`/calls/${call.id}`);
                setCallInfo(data);
            } catch (error) {
                setErrorMessage('Error fetching call details.');
            } finally {
                setLoading(false);
            }
        };

        loadCallDetails();
    }, [call.id]);

    const addNote = async () => {
        try {
            const { data } = await axiosInstance.post(`/calls/${call.id}/note`, { content: noteContent });
            setCallInfo(data);
            setNoteContent('');
        } catch (error) {
            console.error('Error adding note', error);
        }
    };

    if (loading) return <p>Loading details...</p>;
    if (errorMessage) return <p>{errorMessage}</p>;
    if (!callInfo) return null;

    return (
        <div>
            <div className="mb-3">
                
               
                <p><strong>Call Type:</strong> {callInfo.call_type}</p>
                <p><strong>Duration:</strong> {Math.floor(callInfo.duration / 60)} Minutes {callInfo.duration % 60} Seconds</p>
                <p><strong>From:</strong> {callInfo.from}</p>
                <p><strong>To:</strong> {callInfo.to}</p>
                <p><strong>Via:</strong> {callInfo.via}</p>
               
            </div>

            <div className="mb-3">
                <label htmlFor="noteContent" className="form-label">Add a Note</label>
                <textarea
                    id="noteContent"
                    className="form-control"
                    rows="3"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                />
                <button type="button" className="btn btn-primary mt-2" onClick={addNote}>Save</button>
            </div>
        </div>
    );
};

export default CallDetails;
