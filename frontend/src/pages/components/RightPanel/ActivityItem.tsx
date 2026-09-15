import React from 'react';
import { R } from '../../../joiner';
import { Badge } from '../../../components/common/Badge';
import type { BadgeCategory } from '../../../components/common/Badge';

type ActivityAction = 'created' | 'modified' | 'deleted' | 'shared' | 'opened' | 'validated' | 'exported' | 'imported';

type ActivityItemProps = {
    projectId?: string;
    projectName: string;
    action: ActivityAction;
    timestamp: number;
    isRecent?: boolean;
    isLast?: boolean;
};

const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
};

const actionColors: Record<ActivityAction, string> = {
    created: 'success',
    modified: 'info',
    deleted: 'error',
    shared: 'warning',
    opened: 'default',
    validated: 'purple',
    exported: 'orange',
    imported: 'cyan'
};

const actionBadgeCategory: Record<ActivityAction, BadgeCategory> = {
    created: 'version',
    modified: 'state',
    deleted: 'state-danger',
    shared: 'state',
    opened: 'state',
    validated: 'type',
    exported: 'state',
    imported: 'type'
};

const actionText: Record<ActivityAction, string> = {
    created: 'Created',
    modified: 'Modified',
    deleted: 'Deleted',
    shared: 'Shared',
    opened: 'Opened',
    validated: 'Validated',
    exported: 'Exported',
    imported: 'Imported'
};

export const ActivityItem = (props: ActivityItemProps) => {
    const timeAgo = formatTimeAgo(props.timestamp);
    const colorClass = actionColors[props.action] || 'default';

    const handleClick = () => {
        if (props.projectId) {
            R.navigate(`/project?id=${props.projectId}`, true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && props.projectId) {
            e.preventDefault();
            handleClick();
        }
    };

    const isClickable = Boolean(props.projectId);

    return (
        <div
            className={`timeline-item ${props.action} ${props.isRecent ? 'recent' : ''} ${props.isLast ? 'last' : ''} ${isClickable ? 'clickable' : ''}`}
            onClick={isClickable ? handleClick : undefined}
            onKeyDown={isClickable ? handleKeyDown : undefined}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            aria-label={isClickable ? `View ${props.projectName} - ${actionText[props.action]}` : undefined}
        >
            <div className="timeline-marker">
                <span className={`timeline-dot ${colorClass}`} />
                {!props.isLast && <span className="timeline-line" />}
            </div>
            <div className="timeline-content">
                <div className="timeline-header">
                    <span className="timeline-project">{props.projectName}</span>
                    <Badge category={actionBadgeCategory[props.action]}>{actionText[props.action]}</Badge>
                </div>
                <span className="timeline-time">{timeAgo}</span>
            </div>
        </div>
    );
};
