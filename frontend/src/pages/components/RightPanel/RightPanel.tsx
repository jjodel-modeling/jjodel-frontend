import React, { JSX, useMemo } from 'react';
import { LProject, LUser, DUser, L, R } from '../../../joiner';
import { StatCard } from './StatCard';
import { ActivityItem } from './ActivityItem';
import { QuickActionButton } from './QuickActionButton';
import { ProjectsApi } from '../../../api/persistance';
import { useRecentActivities } from '../../../hooks/useRecentActivities';
import { getActivityDisplayConfig, getActivityDisplayName } from '../../../constants/activityTypes';
import { groupActivitiesByTime } from '../../../utils/timeGrouping';
import './RightPanel.scss';

export type RightPanelProps = {
    user?: LUser;
    projects?: LProject[];
};

export function RightPanel(props: RightPanelProps): JSX.Element {
    const user = props.user || L.fromPointer(DUser.current);
    const projects = props.projects || [];

    // Get recent activities from ActivityLogger
    const { activities, isEmpty: noActivities } = useRecentActivities({ limit: 20 });

    // Group activities by time period
    const activityGroups = useMemo(() => groupActivitiesByTime(activities), [activities]);

    // Calculate stats
    const totalProjects = projects.length;
    const favoriteCount = projects.filter(p => p.isFavorite).length;

    // Get recently modified count (last 24 hours)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentlyModified = projects.filter(p => {
        const modTime = typeof p.lastModified === 'number' ? p.lastModified : new Date(p.lastModified).getTime();
        return modTime > dayAgo;
    }).length;

    // Quick actions
    const handleNewProject = async () => {
        await ProjectsApi.create('private', undefined, undefined, undefined, projects);
        R.navigate('/allProjects', true);
    };

    const handleOpenTemplates = () => {
        R.navigate('/templates', true);
    };

    const handleOpenDocs = () => {
        window.open('https://www.jjodel.io/manual/', '_blank');
    };

    return (
        <div className="right-panel">
            {/* Stats Section */}
            <div className="panel-section">
                <h3 className="section-title">Overview</h3>
                <div className="stats-grid">
                    <StatCard
                        icon="bi-folder"
                        label="Total Projects"
                        value={totalProjects}
                    />
                    <StatCard
                        icon="bi-star-fill"
                        label="Favorites"
                        value={favoriteCount}
                        accent="warning"
                    />
                    <StatCard
                        icon="bi-clock-history"
                        label="Modified Today"
                        value={recentlyModified}
                        accent="info"
                    />
                    <StatCard
                        icon="bi-person"
                        label="Account"
                        value={user?.email ? 'Active' : 'Guest'}
                        accent="success"
                    />
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
                        icon="bi-grid-3x3-gap"
                        label="Browse Templates"
                        action={handleOpenTemplates}
                    />
                    <QuickActionButton
                        icon="bi-book"
                        label="Documentation"
                        action={handleOpenDocs}
                    />
                </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="panel-section">
                <h3 className="section-title">Recent Activity</h3>
                <div className="activity-timeline">
                    {activityGroups.length > 0 ? (
                        activityGroups.map((group, groupIndex) => {
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
                                        const isLast = isLastInGroup && isLastGroup;
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
                        })
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
