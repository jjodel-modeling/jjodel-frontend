import React, { useState } from 'react';
import { R } from '../../../joiner';
import { Badge } from '../../../components/common/Badge';
import { GroupedActivity, formatRelativeTime } from '../../../types/activity';
import { getActivityDisplayConfig } from '../../../constants/activityTypes';
import { getGroupSummaryLabel } from '../../../utils/activityGrouping';

type GroupedActivityItemProps = {
    activity: GroupedActivity;
    isRecent?: boolean;
    isLast?: boolean;
};

export const GroupedActivityItem = (props: GroupedActivityItemProps) => {
    const [expanded, setExpanded] = useState(false);
    const { activity, isRecent, isLast } = props;

    const latestTime = formatRelativeTime(activity.latestTimestamp);
    const summaryLabel = getGroupSummaryLabel(activity);

    const handleNavigate = () => {
        if (activity.projectId) {
            R.navigate(`/project?id=${activity.projectId}`, true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && activity.projectId) {
            e.preventDefault();
            handleNavigate();
        }
    };

    const toggleExpanded = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };

    return (
        <div
            className={`timeline-item grouped modified ${isRecent ? 'recent' : ''} ${isLast ? 'last' : ''}`}
        >
            <div className="timeline-marker">
                <span className="timeline-dot info" />
                {!isLast && <span className="timeline-line" />}
            </div>
            <div className="timeline-content">
                <div className="timeline-header">
                    <span className="timeline-project">{activity.entityName || activity.projectName}</span>
                    <Badge category="state">
                        {activity.count}x Modified
                    </Badge>
                </div>
                <div className="timeline-summary">{summaryLabel}</div>
                <span className="timeline-time">Latest: {latestTime}</span>

                <button
                    className="timeline-expand-btn"
                    onClick={toggleExpanded}
                    aria-expanded={expanded}
                >
                    {expanded ? 'Hide details' : 'Show details'}
                    <i className={`bi bi-chevron-${expanded ? 'up' : 'down'}`} />
                </button>

                {expanded && (
                    <div className="timeline-group-details">
                        {activity.items.map((item) => {
                            const config = getActivityDisplayConfig(item.type);
                            return (
                                <div key={item.id} className="timeline-group-item">
                                    <span className="group-item-label">{config.label}</span>
                                    {item.metadata?.elementName && (
                                        <span className="group-item-name"> - {item.metadata.elementName}</span>
                                    )}
                                    <span className="group-item-time">
                                        {formatRelativeTime(item.timestamp)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <button
                    className="timeline-navigate-btn"
                    onClick={handleNavigate}
                    onKeyDown={handleKeyDown}
                >
                    View project
                    <i className="bi bi-arrow-right" />
                </button>
            </div>
        </div>
    );
};
