import React from 'react';

/**
 * Gamification Components for PyMastery
 * Contains gamification features like points, badges, leaderboards
 */

export const PointsDisplay: React.FC<{ points: number }> = ({ points }) => {
  return (
    <div className="points-display">
      <span className="points-icon">⭐</span>
      <span className="points-value">{points.toLocaleString()}</span>
      <span className="points-label">Points</span>
    </div>
  );
};

export const BadgeCollection: React.FC<{ badges: string[] }> = ({ badges }) => {
  return (
    <div className="badge-collection">
      <h3>Badges Earned</h3>
      <div className="badges-grid">
        {badges.map((badge, index) => (
          <div key={index} className="badge">
            <div className="badge-icon">🏆</div>
            <span className="badge-name">{badge}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Leaderboard: React.FC<{ users: Array<{ name: string; points: number; rank: number }> }> = ({ 
  users 
}) => {
  return (
    <div className="leaderboard">
      <h3>Leaderboard</h3>
      <div className="leaderboard-list">
        {users.map((user) => (
          <div key={user.rank} className="leaderboard-item">
            <span className="rank">#{user.rank}</span>
            <span className="name">{user.name}</span>
            <span className="points">{user.points.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AchievementPopup: React.FC<{
  achievement: string;
  points: number;
  onClose: () => void;
}> = ({ achievement, points, onClose }) => {
  return (
    <div className="achievement-popup">
      <div className="achievement-content">
        <div className="achievement-icon">🎉</div>
        <h3>Achievement Unlocked!</h3>
        <p>{achievement}</p>
        <div className="achievement-points">+{points} points</div>
        <button onClick={onClose} className="achievement-close">
          Continue
        </button>
      </div>
    </div>
  );
};

export default PointsDisplay;
