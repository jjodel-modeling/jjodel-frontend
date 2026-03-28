import React from 'react';

interface WorkbenchCanvasProps {
    height: number;
}

const WorkbenchCanvas: React.FC<WorkbenchCanvasProps> = ({ height }) => {
    return (
        <div className="viewpoint-workbench__canvas" style={{ height }}>
            <div className="workbench-placeholder">
                <i className="bi bi-easel" style={{ fontSize: 20, color: '#94a3b8' }} />
                <span>Canvas — Classic Editor preview will be integrated here</span>
            </div>
        </div>
    );
};

export default WorkbenchCanvas;
