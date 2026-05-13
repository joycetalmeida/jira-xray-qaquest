/**
 * QAQuest Badge Component
 * Professional React component for rendering gamification badges
 */

import React, { useState } from 'react';
import './BadgeComponent.css';

// Badge configuration
const BADGE_CONFIG = {
  'test-architect': {
    name: 'Test Architect',
    metric: 'Test cases created',
    color: '#4A90E2',
    icon: 'building',
    description: 'Reward for creating well-structured test cases'
  },
  'defect-hunter': {
    name: 'Defect Hunter',
    metric: 'Defects reported',
    color: '#E85D75',
    icon: 'target',
    description: 'Reward for finding and reporting defects'
  },
  'retest-master': {
    name: 'Retest Master',
    metric: 'Defects re-tested post-fix',
    color: '#9B59B6',
    icon: 'retry',
    description: 'Reward for verifying bug fixes'
  },
  'plan-strategist': {
    name: 'Plan Strategist',
    metric: 'Plans with associated tests',
    color: '#F39C12',
    icon: 'grid',
    description: 'Reward for strategic planning'
  },
  'elite-documenter': {
    name: 'Elite Documenter',
    metric: '% tests with description',
    color: '#16A085',
    icon: 'document',
    description: 'Reward for test documentation'
  },
  'gherkin-guardian': {
    name: 'Gherkin Guardian',
    metric: '% tests with Gherkin',
    color: '#27AE60',
    icon: 'shield',
    description: 'Reward for using BDD practices'
  },
  'evidence-curator': {
    name: 'Evidence Curator',
    metric: '% tests with evidence',
    color: '#2980B9',
    icon: 'camera',
    description: 'Reward for attaching test evidence'
  },
  'traceability-lord': {
    name: 'Traceability Lord',
    metric: '% tests with traceability',
    color: '#8E44AD',
    icon: 'network',
    description: 'Reward for requirements traceability'
  },
  'coverage-guardian': {
    name: 'Coverage Guardian',
    metric: '% stories with test coverage',
    color: '#E74C3C',
    icon: 'gauge',
    description: 'Reward for comprehensive coverage'
  },
  'sprint-finisher': {
    name: 'Sprint Finisher',
    metric: '% items resolved within sprint',
    color: '#F1C40F',
    icon: 'flag',
    description: 'Reward for on-time delivery'
  }
};

/**
 * Individual Badge Component
 */
export const Badge = ({ badgeId, level = 1, progress = 0, size = 'medium', interactive = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = BADGE_CONFIG[badgeId];

  if (!config) {
    return <div className="badge-error">Badge not found: {badgeId}</div>;
  }

  const sizeClass = `badge-${size}`;
  const isUnlocked = level > 0;

  return (
    <div
      className={`badge-wrapper ${sizeClass} ${interactive ? 'interactive' : ''}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`badge ${isUnlocked ? 'unlocked' : 'locked'}`}>
        <svg viewBox="0 0 120 120" className="badge-svg">
          <defs>
            <linearGradient id={`grad-${badgeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: config.color, stopOpacity: 1 }} />
              <stop
                offset="100%"
                style={{ stopColor: adjustColorBrightness(config.color, -30), stopOpacity: 1 }}
              />
            </linearGradient>
            <filter id={`glow-${badgeId}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Main circle */}
          <circle
            cx="60"
            cy="60"
            r="55"
            fill={`url(#grad-${badgeId})`}
            stroke={isUnlocked ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.2)'}
            strokeWidth="2"
            filter={isUnlocked ? `url(#glow-${badgeId})` : ''}
          />

          {/* Progress ring (if not fully unlocked) */}
          {level < 5 && progress > 0 && (
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="3"
              strokeDasharray={`${(progress / 100) * 326} 326`}
              strokeLinecap="round"
              opacity="0.7"
            />
          )}

          {/* Level number or lock icon */}
          {isUnlocked ? (
            <text
              x="60"
              y="75"
              fontSize="50"
              fontWeight="bold"
              textAnchor="middle"
              fill="white"
              className="badge-level-text"
            >
              {level}
            </text>
          ) : (
            <text
              x="60"
              y="70"
              fontSize="40"
              textAnchor="middle"
              fill="rgba(255,255,255,0.6)"
              className="badge-lock-icon"
            >
              🔒
            </text>
          )}
        </svg>

        {/* Stars for achieved level */}
        {isUnlocked && level > 0 && (
          <div className="badge-stars">
            {[...Array(Math.min(level, 5))].map((_, i) => (
              <span key={i} className="star">
                ⭐
              </span>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {progress > 0 && level < 5 && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Badge info */}
      <div className="badge-info">
        <div className="badge-name">{config.name}</div>
        <div className="badge-level">
          {isUnlocked ? `Level ${level}/5` : 'Locked'}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="badge-tooltip">
          <div className="tooltip-name">{config.name}</div>
          <div className="tooltip-metric">{config.metric}</div>
          <div className="tooltip-description">{config.description}</div>
          {progress > 0 && level < 5 && (
            <div className="tooltip-progress">Progress: {progress}%</div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Badge Grid Component - Display all badges
 */
export const BadgeGrid = ({ userBadges = {}, size = 'medium' }) => {
  return (
    <div className="badge-grid">
      {Object.entries(BADGE_CONFIG).map(([badgeId, config]) => {
        const badgeData = userBadges[badgeId] || { level: 0, progress: 0 };
        return (
          <Badge
            key={badgeId}
            badgeId={badgeId}
            level={badgeData.level}
            progress={badgeData.progress}
            size={size}
            interactive
          />
        );
      })}
    </div>
  );
};

/**
 * Badge Showcase Component - Full-featured badge display
 */
export const BadgeShowcase = ({ userBadges = {} }) => {
  const unlockedCount = Object.values(userBadges).filter(b => b.level > 0).length;
  const totalBadges = Object.keys(BADGE_CONFIG).length;
  const totalLevel = Object.values(userBadges).reduce((sum, b) => sum + (b.level || 0), 0);

  return (
    <div className="badge-showcase">
      <div className="showcase-header">
        <h2>Badge Collection</h2>
        <div className="showcase-stats">
          <div className="stat">
            <span className="stat-value">{unlockedCount}</span>
            <span className="stat-label">Badges Earned</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalLevel}</span>
            <span className="stat-label">Total Levels</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Math.round((unlockedCount / totalBadges) * 100)}%</span>
            <span className="stat-label">Completion</span>
          </div>
        </div>
      </div>

      <BadgeGrid userBadges={userBadges} size="large" />
    </div>
  );
};

/**
 * Level Progression Component
 */
export const LevelProgression = () => {
  return (
    <div className="level-progression">
      <h3>Level System</h3>
      <div className="levels-container">
        {[1, 2, 3, 4, 5].map(level => (
          <div key={level} className="level-item">
            <svg viewBox="0 0 100 100" className="level-badge">
              <defs>
                <linearGradient id={`level-grad-${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="45"
                fill={`url(#level-grad-${level})`}
                stroke="white"
                strokeWidth="2"
              />
              <text
                x="50"
                y="62"
                fontSize="40"
                fontWeight="bold"
                textAnchor="middle"
                fill="white"
              >
                {level}
              </text>
            </svg>
            <div className="level-info">
              <div className="level-number">Level {level}</div>
              <div className="level-points">{140 * level} pts</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Utility function to adjust color brightness
 */
function adjustColorBrightness(color, amount) {
  const col = parseInt(color.slice(1), 16);
  const r = Math.max(0, Math.min(255, (col >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((col >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (col & 0x0000ff) + amount));
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

export default Badge;
