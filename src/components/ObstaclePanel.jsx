import React from 'react';

const OBSTACLE_TYPES = [
  { type: 'box', label: '方块', icon: '📦' },
  { type: 'cylinder', label: '圆柱', icon: '🛢️' },
  { type: 'sphere', label: '球体', icon: '🔮' },
  { type: 'car', label: '载具', icon: '🚗' },
  { type: 'barrier', label: '掩体', icon: '🧱' },
  { type: 'drone', label: '无人机', icon: '🛸' },
];

export default function ObstaclePanel({
  selectedType,
  onSelect,
  onClear,
  placementMode,
  onCancel,
}) {
  return (
    <>
      {/* Obstacle selection panel */}
      <div className="obstacle-panel">
        <h3>🎮 放置障碍物</h3>
        <div className="obstacle-list">
          {OBSTACLE_TYPES.map((obs) => (
            <button
              key={obs.type}
              className={`obstacle-btn ${selectedType === obs.type ? 'active' : ''}`}
              onClick={() => onSelect(obs.type)}
            >
              <span className="obstacle-icon">{obs.icon}</span>
              {obs.label}
            </button>
          ))}
        </div>
        <button
          className="obstacle-btn"
          style={{ marginTop: '15px', background: 'rgba(255, 68, 68, 0.2)' }}
          onClick={onClear}
        >
          🗑️ 清空场景
        </button>
      </div>

      {/* Placement mode hint */}
      {placementMode && (
        <div className="placement-preview">
          <p>
            🔫 放置模式：点击场景放置 {selectedType}
            <button
              style={{
                marginLeft: '15px',
                padding: '5px 10px',
                background: 'rgba(255, 68, 68, 0.3)',
                border: 'none',
                borderRadius: '5px',
                color: 'white',
                cursor: 'pointer',
              }}
              onClick={onCancel}
            >
              取消
            </button>
          </p>
        </div>
      )}
    </>
  );
}
