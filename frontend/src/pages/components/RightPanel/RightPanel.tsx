import React, { JSX, useMemo } from 'react';
import { LProject, LUser, DUser, L, R } from '../../../joiner';
import { ActivityItem } from './ActivityItem';
import { GroupedActivityItem } from './GroupedActivityItem';
import { QuickActionButton } from './QuickActionButton';
import { ProjectsApi } from '../../../api/persistance';
import { useRecentActivities } from '../../../hooks/useRecentActivities';
import { getActivityDisplayConfig, getActivityDisplayName } from '../../../constants/activityTypes';
import { groupTimelineActivitiesByTime } from '../../../utils/timeGrouping';
import { isGroupedActivity } from '../../../types/activity';
import { DevModeLabel } from '../../../components/DevModeLabel/DevModeLabel';
import './RightPanel.scss';

export type RightPanelProps = {
    user?: LUser;
    projects?: LProject[];
    onNewProject?: () => void;
};

export function RightPanel(props: RightPanelProps): JSX.Element {
    const user = props.user || L.fromPointer(DUser.current);
    const projects = props.projects || [];

    // Get recent activities from ActivityLogger with pagination and grouping
    const {
        activities,
        isEmpty: noActivities,
        hasMore,
        remainingCount,
        loadMore,
        scrollToTop,
        timelineRef,
    } = useRecentActivities({ limit: 15, enableGrouping: true });

    // Group activities by time period
    const activityGroups = useMemo(() => groupTimelineActivitiesByTime(activities), [activities]);

    // Calculate stats
    const totalProjects = projects.length;
    const favoriteCount = projects.filter(p => p.isFavorite).length;

    // Get recently modified count (last 24 hours)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentlyModified = projects.filter(p => {
        const modTime = typeof p.lastModified === 'number' ? p.lastModified : new Date(p.lastModified).getTime();
        return modTime > dayAgo;
    }).length;

    // Quick actions - use prop if provided, otherwise fallback to internal handler
    const handleNewProject = props.onNewProject || (async () => {
        await ProjectsApi.create('private', undefined, undefined, undefined, projects);
        R.navigate('/allProjects', true);
    });

    const handleUserManual = () => {
        window.open('https://www.jjodel.io/user-manual/', '_blank');
    };

    const handleOpenDocs = () => {
        window.open('https://www.jjodel.io/documentation/', '_blank');
    };

    return (
        <div className="right-panel">
            {/* Dev Mode Label */}
            <DevModeLabel componentId="T4.4" position="bottom-right" />

            {/* Overview Section - Unified Card with 4 Quadrants */}
            <div className="panel-section">
                <h3 className="section-title">Overview</h3>
                <div className="overview-grid">
                    <div
                        className="overview-cell"
                        onClick={() => R.navigate('/allProjects', true)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') R.navigate('/allProjects', true); }}
                    >
                        <i className="bi bi-folder overview-icon" />
                        <span className="cell-value">{totalProjects}</span>
                        <span className="overview-label">Projects</span>
                    </div>
                    <div
                        className="overview-cell"
                        onClick={() => R.navigate('/allProjects?filter=favorites', true)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') R.navigate('/allProjects?filter=favorites', true); }}
                    >
                        <i className="bi bi-star-fill overview-icon" />
                        <span className="cell-value">{favoriteCount}</span>
                        <span className="overview-label">Favorites</span>
                    </div>
                    <div
                        className="overview-cell"
                        onClick={() => R.navigate('/allProjects?filter=recent', true)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') R.navigate('/allProjects?filter=recent', true); }}
                    >
                        <i className="bi bi-clock-history overview-icon" />
                        <span className="cell-value">{recentlyModified}</span>
                        <span className="overview-label">Modified Today</span>
                    </div>
                    <div
                        className="overview-cell"
                        onClick={() => R.navigate('/account', true)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') R.navigate('/account', true); }}
                    >
                        <i className="bi bi-person overview-icon" />
                        <span className="cell-value">—</span>
                        <span className="overview-label">Account</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="panel-section">
                <h3 className="section-title">Quick Actions</h3>
                <div className="quick-actions">
                    <QuickActionButton
                        icon="bi-plus-lg"
                        label="New Project"
                        action={handleNewProject}
                        variant="primary"
                    />
                    <QuickActionButton
                        icon="bi-journal-text"
                        label="User Manual"
                        action={handleUserManual}
                    />
                    <QuickActionButton
                        icon="bi-book"
                        label="Documentation"
                        action={handleOpenDocs}
                    />
                </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="panel-section activity-section">
                <div className="activity-header">
                    <h3 className="section-title">Recent Activity</h3>
                    {activityGroups.length > 0 && (
                        <button
                            className="scroll-to-top-btn"
                            onClick={scrollToTop}
                            title="Scroll to top"
                        >
                            <i className="bi bi-arrow-up" />
                        </button>
                    )}
                </div>
                <div className="activity-timeline" ref={timelineRef}>
                    {activityGroups.length > 0 ? (
                        <>
                            {activityGroups.map((group, groupIndex) => {
                                // Calculate total items before this group for isRecent check
                                let itemsBefore = 0;
                                for (let i = 0; i < groupIndex; i++) {
                                    itemsBefore += activityGroups[i].items.length;
                                }

                                return (
                                    <div key={group.label} className="timeline-group">
                                        <div className="timeline-group-label">{group.label}</div>
                                        {group.items.map((activity, idx) => {
                                            const globalIndex = itemsBefore + idx;
                                            const isLastInGroup = idx === group.items.length - 1;
                                            const isLastGroup = groupIndex === activityGroups.length - 1;
                                            const isLast = isLastInGroup && isLastGroup && !hasMore;

                                            // Handle grouped activities
                                            if (isGroupedActivity(activity)) {
                                                return (
                                                    <GroupedActivityItem
                                                        key={activity.id}
                                                        activity={activity}
                                                        isRecent={globalIndex === 0}
                                                        isLast={isLast}
                                                    />
                                                );
                                            }

                                            // Regular single activity
                                            const config = getActivityDisplayConfig(activity.type);
                                            const displayName = getActivityDisplayName(activity);

                                            return (
                                                <ActivityItem
                                                    key={activity.id}
                                                    projectId={activity.projectId}
                                                    projectName={displayName}
                                                    action={config.action}
                                                    timestamp={activity.timestamp instanceof Date ? activity.timestamp.getTime() : activity.timestamp}
                                                    isRecent={globalIndex === 0}
                                                    isLast={isLast}
                                                />
                                            );
                                        })}
                                    </div>
                                );
                            })}
                            {hasMore && (
                                <button className="load-more-btn" onClick={loadMore}>
                                    <i className="bi bi-arrow-down" />
                                    Load more ({remainingCount} older)
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="empty-activity">
                            <i className="bi bi-inbox" />
                            <span>No recent activity</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RightPanel;
