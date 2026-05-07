import React, { useState, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas.jsx';
import ObstaclePanel from './components/ObstaclePanel.jsx';
import HUD from './components/HUD.jsx';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedObstacle, setSelectedObstacle] = useState(null);
  const [obstacles, setObstacles] = useState([]);
  const [placementMode, setPlacementMode] = useState(false);
  const gameRef = useRef(null);

  const handleStart = useCallback(() => {
    setGameStarted(true);
  }, []);

  const handleLoaded = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleSelectObstacle = useCallback((type) => {
    setSelectedObstacle(type);
    setPlacementMode(true);
    if (gameRef.current) {
      gameRef.current.setPlacementMode(true, type);
    }
  }, []);

  const handlePlaceObstacle = useCallback((position, type) => {
    const newObstacle = {
      id: Date.now(),
      type,
      position,
    };
    setObstacles(prev => [...prev, newObstacle]);
    setPlacementMode(false);
    setSelectedObstacle(null);
  }, []);

  const handleCancelPlacement = useCallback(() => {
    setPlacementMode(false);
    setSelectedObstacle(null);
    if (gameRef.current) {
      gameRef.current.setPlacementMode(false);
    }
  }, []);

  const handleClearObstacles = useCallback(() => {
    setObstacles([]);
    if (gameRef.current) {
      gameRef.current.clearObstacles();
    }
  }, []);

  return (
    <div className="game-container">
      <GameCanvas
        ref={gameRef}
        gameStarted={gameStarted}
        obstacles={obstacles}
        onLoaded={handleLoaded}
        onPlaceObstacle={handlePlaceObstacle}
        onStart={handleStart}
      />

      {!gameStarted && !isLoading && (
        <div className="lock-overlay">
          <h1>🎮 PlayCanvas GS FPS</h1>
          <p>基于 3D Gaussian Splatting 的沉浸式射击游戏</p>
          <button className="start-btn" onClick={handleStart}>
            开始游戏
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p className="loading-text">加载 3DGS 场景中...</p>
        </div>
      )}

      {gameStarted && !isLoading && (
        <>
          <HUD />
          <ObstaclePanel
            selectedType={selectedObstacle}
            onSelect={handleSelectObstacle}
            onClear={handleClearObstacles}
            placementMode={placementMode}
            onCancel={handleCancelPlacement}
          />
        </>
      )}
    </div>
  );
}
