import React, { useState, useEffect } from 'react';

export default function HUD() {
  const [showHit, setShowHit] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [velocity, setVelocity] = useState(0);

  useEffect(() => {
    const handleHit = () => {
      setShowHit(true);
      setTimeout(() => setShowHit(false), 300);
    };

    const handleMove = (e) => {
      setIsMoving(e.detail?.isMoving || false);
      setVelocity(e.detail?.velocity || 0);
    };

    window.addEventListener('gameHit', handleHit);
    window.addEventListener('playerMove', handleMove);

    return () => {
      window.removeEventListener('gameHit', handleHit);
      window.removeEventListener('playerMove', handleMove);
    };
  }, []);

  return (
    <div className="hud">
      {/* Crosshair */}
      <div className="crosshair">
        <div className="crosshair-dot"></div>
      </div>

      {/* Hit effect */}
      {showHit && (
        <div className="hit-effect">
          <div className="hit-ring"></div>
        </div>
      )}

      {/* Movement indicator */}
      <div className="movement-indicator">
        <p>速度</p>
        <div className="velocity-bar">
          <div
            className="velocity-fill"
            style={{ width: `${Math.min(velocity * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Controls hint */}
      <div className="controls-hint">
        <span>WASD</span> 移动 |
        <span>空格</span> 跳跃 |
        <span>鼠标</span> 瞄准 |
        <span>左键</span> 射击 |
        <span>ESC</span> 暂停
      </div>
    </div>
  );
}
