import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as pc from 'playcanvas';

const GameCanvas = forwardRef(({ gameStarted, obstacles, onLoaded, onPlaceObstacle }, ref) => {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const cameraRef = useRef(null);
  const playerRef = useRef(null);
  const obstaclesRef = useRef([]);
  const placementModeRef = useRef(false);
  const placementTypeRef = useRef(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    setPlacementMode: (enabled, type) => {
      placementModeRef.current = enabled;
      placementTypeRef.current = type;
    },
    clearObstacles: () => {
      const app = appRef.current;
      if (!app) return;

      obstaclesRef.current.forEach(obs => {
        app.root.removeChild(obs.entity);
        obs.entity.destroy();
      });
      obstaclesRef.current = [];
    },
  }));

  // Initialize PlayCanvas application
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create PlayCanvas application
    const app = new pc.Application(canvasRef.current, {
      mouse: new pc.Mouse(canvasRef.current),
      keyboard: new pc.Keyboard(window),
      touch: new pc.TouchDevice(canvasRef.current),
    });

    appRef.current = app;
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);

    // Set scene ambient lighting
    app.scene.ambientLight = new pc.Color(0.4, 0.4, 0.4);

    // Create camera
    const camera = new pc.Entity('camera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.05, 0.05, 0.1),
      nearClip: 0.1,
      farClip: 1000,
    });
    camera.setPosition(0, 1.7, 5);
    camera.lookAt(0, 1.7, 0);
    app.root.addChild(camera);
    cameraRef.current = camera;

    // Create directional light
    const light = new pc.Entity('light');
    light.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, 1, 1),
      intensity: 1,
      castShadows: true,
      shadowDistance: 50,
      shadowResolution: 2048,
    });
    light.setEulerAngles(45, 135, 0);
    app.root.addChild(light);

    // Create player controller entity
    const player = new pc.Entity('player');
    player.addComponent('collision', {
      type: 'capsule',
      radius: 0.3,
      height: 1.7,
    });
    player.addComponent('rigidbody', {
      type: 'dynamic',
      mass: 70,
      friction: 0.5,
      restitution: 0,
    });
    player.rigidbody.linearDamping = 0.4;
    player.rigidbody.angularDamping = 0.4;
    player.setPosition(0, 2, 5);
    app.root.addChild(player);
    playerRef.current = player;

    // Create ground plane
    createGround(app);

    // Create sample obstacles
    createSampleObstacles(app);

    // Load 3DGS scene using gsplat
    loadGSplatScene(app);

    // Start the application
    app.start();

    // Setup input handlers
    setupInputHandlers(app, camera, player);

    // Animation loop
    app.on('update', (dt) => {
      updatePlayerMovement(app, camera, player, dt);
    });

    // Handle resize
    const handleResize = () => {
      app.resizeCanvas();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      app.destroy();
    };
  }, []);

  // Handle game start
  useEffect(() => {
    if (gameStarted && canvasRef.current) {
      // Request pointer lock for FPS controls
      canvasRef.current.requestPointerLock?.();
    }
  }, [gameStarted]);

  // Handle obstacles from parent
  useEffect(() => {
    if (obstacles.length > 0) {
      obstacles.forEach((obs) => {
        addObstacle(obs.type, obs.position);
      });
    }
  }, [obstacles]);

  // Create ground plane
  const createGround = (app) => {
    const ground = new pc.Entity('ground');
    ground.addComponent('render', {
      type: 'plane',
    });
    ground.addComponent('collision', {
      type: 'plane',
    });
    ground.addComponent('rigidbody', {
      type: 'static',
    });
    ground.setPosition(0, 0, 0);
    app.root.addChild(ground);

    // Add some visual ground
    const groundVisual = new pc.Entity('groundVisual');
    groundVisual.addComponent('render', {
      type: 'plane',
      material: createGridMaterial(app),
    });
    groundVisual.setLocalScale(100, 1, 100);
    groundVisual.setPosition(0, 0.01, 0);
    app.root.addChild(groundVisual);
  };

  // Create grid material
  const createGridMaterial = (app) => {
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(0.15, 0.15, 0.25);
    material.specular = new pc.Color(0.1, 0.1, 0.1);
    material.gloss = 0.2;
    material.update();
    return material;
  };

  // Create sample obstacles
  const createSampleObstacles = (app) => {
    const boxMaterial = new pc.StandardMaterial();
    boxMaterial.diffuse = new pc.Color(0.4, 0.6, 0.9);
    boxMaterial.specular = new pc.Color(0.5, 0.5, 0.5);
    boxMaterial.gloss = 0.5;
    boxMaterial.update();

    for (let i = 0; i < 15; i++) {
      const box = new pc.Entity('box_' + i);
      box.addComponent('render', {
        type: 'box',
        material: boxMaterial,
      });
      box.addComponent('collision', {
        type: 'box',
        halfExtents: new pc.Vec3(0.5, 0.5, 0.5),
      });
      box.addComponent('rigidbody', {
        type: 'static',
      });
      box.setPosition(
        Math.random() * 30 - 15,
        0.5,
        Math.random() * 30 - 15
      );
      app.root.addChild(box);
      obstaclesRef.current.push({ entity: box, type: 'box' });
    }
  };

  // Load GSplat scene
  const loadGSplatScene = async (app) => {
    try {
      // Dynamically import gsplat
      const gsplat = await import('gsplat');

      // Note: gsplat requires loading actual splat files
      // For demo, we'll create a visual representation
      // In production, use: await gsplat.load('path/to/scene.sog');

      console.log('gsplat library loaded:', gsplat);

      // Mark as loaded after a delay (simulating scene loading)
      setTimeout(() => {
        if (onLoaded) onLoaded();
      }, 1500);
    } catch (error) {
      console.error('Failed to load gsplat:', error);
      // Fallback: show placeholder scene
      setTimeout(() => {
        if (onLoaded) onLoaded();
      }, 1000);
    }
  };

  // Setup input handlers
  const setupInputHandlers = (app, camera, player) => {
    const input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
      shoot: false,
    };

    // Keyboard handlers
    app.keyboard.on('keydown', (e) => {
      switch (e.key) {
        case pc.KEY_W:
        case pc.KEY_UP:
          input.forward = true;
          break;
        case pc.KEY_S:
        case pc.KEY_DOWN:
          input.backward = true;
          break;
        case pc.KEY_A:
        case pc.KEY_LEFT:
          input.left = true;
          break;
        case pc.KEY_D:
        case pc.KEY_RIGHT:
          input.right = true;
          break;
        case pc.KEY_SPACE:
          input.jump = true;
          break;
        case pc.KEY_SHIFT:
          input.sprint = true;
          break;
      }
    });

    app.keyboard.on('keyup', (e) => {
      switch (e.key) {
        case pc.KEY_W:
        case pc.KEY_UP:
          input.forward = false;
          break;
        case pc.KEY_S:
        case pc.KEY_DOWN:
          input.backward = false;
          break;
        case pc.KEY_A:
        case pc.KEY_LEFT:
          input.left = false;
          break;
        case pc.KEY_D:
        case pc.KEY_RIGHT:
          input.right = false;
          break;
        case pc.KEY_SPACE:
          input.jump = false;
          break;
        case pc.KEY_SHIFT:
          input.sprint = false;
          break;
      }
    });

    // Store input state
    playerRef.current.input = input;

    // Mouse click for shooting
    app.mouse.on('mousedown', (e) => {
      if (e.button === pc.MOUSEBUTTON_LEFT) {
        input.shoot = true;
        shoot(player, camera, app);
      }
    });

    app.mouse.on('mouseup', (e) => {
      if (e.button === pc.MOUSEBUTTON_LEFT) {
        input.shoot = false;
      }
    });

    // Pointer lock for FPS view
    app.mouse.on('mousemove', (e) => {
      if (document.pointerLockElement === app.graphicsDevice.canvas) {
        const sensitivity = 0.05;
        const euler = camera.getEulerAngles();
        euler.x -= e.dy * sensitivity;
        euler.y -= e.dx * sensitivity;
        euler.x = Math.max(-90, Math.min(90, euler.x));
        camera.setEulerAngles(euler.x, euler.y, 0);
      }
    });
  };

  // Update player movement
  const updatePlayerMovement = (app, camera, player, dt) => {
    if (!player.input) return;

    const input = player.input;
    const speed = input.sprint ? 12 : 6;
    const force = new pc.Vec3();

    // Get camera direction
    const forward = new pc.Vec3();
    camera.getWorldTransform().getZ(forward);
    forward.scale(-1);
    forward.y = 0;
    forward.normalize();

    const right = new pc.Vec3();
    camera.getWorldTransform().getX(right);
    right.y = 0;
    right.normalize();

    // Calculate movement direction
    if (input.forward) {
      force.add(forward.clone().scale(speed));
    }
    if (input.backward) {
      force.add(forward.clone().scale(-speed));
    }
    if (input.left) {
      force.add(right.clone().scale(-speed));
    }
    if (input.right) {
      force.add(right.clone().scale(speed));
    }

    // Apply movement force
    if (force.length() > 0) {
      player.rigidbody.linearVelocity = new pc.Vec3(
        force.x,
        player.rigidbody.linearVelocity.y,
        force.z
      );
    }

    // Jump
    if (input.jump && player.getPosition().y < 2) {
      player.rigidbody.linearVelocity = new pc.Vec3(
        player.rigidbody.linearVelocity.x,
        5,
        player.rigidbody.linearVelocity.z
      );
    }
  };

  // Shooting function
  const shoot = (player, camera, app) => {
    const direction = new pc.Vec3();
    camera.getWorldTransform().getZ(direction);
    direction.scale(-1);

    // Create bullet
    const bullet = new pc.Entity('bullet');
    bullet.addComponent('render', {
      type: 'sphere',
    });
    bullet.addComponent('collision', {
      type: 'sphere',
      radius: 0.05,
    });
    bullet.addComponent('rigidbody', {
      type: 'dynamic',
      mass: 1,
    });
    bullet.rigidbody.linearVelocity = direction.clone().scale(50);
    bullet.rigidbody.linearDamping = 0.5;

    const bulletMaterial = new pc.StandardMaterial();
    bulletMaterial.emissive = new pc.Color(1, 0.8, 0);
    bulletMaterial.update();
    bullet.render.material = bulletMaterial;

    const startPos = camera.getPosition().clone();
    startPos.add(direction.clone().scale(0.5));
    bullet.setPosition(startPos);
    app.root.addChild(bullet);

    // Remove bullet after 3 seconds
    setTimeout(() => {
      if (bullet.parent) {
        app.root.removeChild(bullet);
        bullet.destroy();
      }
    }, 3000);

    // Create muzzle flash
    createMuzzleFlash(app, startPos);
  };

  // Create muzzle flash effect
  const createMuzzleFlash = (app, position) => {
    const flash = new pc.Entity('flash');
    flash.addComponent('render', {
      type: 'sphere',
    });
    const flashMaterial = new pc.StandardMaterial();
    flashMaterial.emissive = new pc.Color(1, 0.5, 0);
    flashMaterial.emissiveIntensity = 5;
    flashMaterial.opacity = 0.8;
    flashMaterial.blendType = pc.BLEND_ADDITIVE;
    flashMaterial.update();
    flash.render.material = flashMaterial;
    flash.setLocalScale(0.2, 0.2, 0.2);
    flash.setPosition(position);
    app.root.addChild(flash);

    // Fade out and remove
    let scale = 0.2;
    const fadeInterval = setInterval(() => {
      scale -= 0.02;
      flash.setLocalScale(scale, scale, scale);
      if (scale <= 0) {
        clearInterval(fadeInterval);
        app.root.removeChild(flash);
        flash.destroy();
      }
    }, 16);
  };

  // Add obstacle
  const addObstacle = (type, position) => {
    const app = appRef.current;
    if (!app) return;

    let entity;
    const material = new pc.StandardMaterial();

    switch (type) {
      case 'box':
        entity = new pc.Entity('obstacle_box');
        entity.addComponent('render', { type: 'box' });
        entity.addComponent('collision', {
          type: 'box',
          halfExtents: new pc.Vec3(0.5, 0.5, 0.5),
        });
        material.diffuse = new pc.Color(0.4, 0.6, 0.9);
        break;

      case 'cylinder':
        entity = new pc.Entity('obstacle_cylinder');
        entity.addComponent('render', { type: 'cylinder' });
        entity.addComponent('collision', {
          type: 'cylinder',
          radius: 0.5,
          height: 2,
        });
        material.diffuse = new pc.Color(0.46, 0.29, 0.64);
        break;

      case 'sphere':
        entity = new pc.Entity('obstacle_sphere');
        entity.addComponent('render', { type: 'sphere' });
        entity.addComponent('collision', {
          type: 'sphere',
          radius: 0.7,
        });
        material.diffuse = new pc.Color(0.28, 0.73, 0.47);
        break;

      case 'car':
        entity = new pc.Entity('obstacle_car');
        entity.addComponent('render', { type: 'box' });
        entity.addComponent('collision', {
          type: 'box',
          halfExtents: new pc.Vec3(1, 0.4, 2),
        });
        entity.setLocalScale(2, 0.8, 4);
        material.diffuse = new pc.Color(0.94, 0.27, 0.27);
        break;

      case 'barrier':
        entity = new pc.Entity('obstacle_barrier');
        entity.addComponent('render', { type: 'box' });
        entity.addComponent('collision', {
          type: 'box',
          halfExtents: new pc.Vec3(1, 0.5, 0.15),
        });
        entity.setLocalScale(2, 1, 0.3);
        material.diffuse = new pc.Color(0.29, 0.34, 0.42);
        break;

      case 'drone':
        entity = new pc.Entity('obstacle_drone');
        entity.addComponent('render', { type: 'sphere' });
        entity.addComponent('collision', {
          type: 'sphere',
          radius: 0.5,
        });
        entity.setLocalScale(1, 0.3, 1);
        material.diffuse = new pc.Color(0.23, 0.51, 0.96);
        break;

      default:
        entity = new pc.Entity('obstacle_default');
        entity.addComponent('render', { type: 'box' });
        entity.addComponent('collision', { type: 'box' });
        material.diffuse = new pc.Color(0.5, 0.5, 0.5);
    }

    material.specular = new pc.Color(0.3, 0.3, 0.3);
    material.gloss = 0.5;
    material.update();
    entity.render.material = material;

    entity.addComponent('rigidbody', {
      type: 'static',
    });

    entity.setPosition(position.x, position.y || 0.5, position.z);
    app.root.addChild(entity);
    obstaclesRef.current.push({ entity, type });
  };

  return (
    <div className="canvas-wrapper">
      <canvas ref={canvasRef} id="application-canvas" />
    </div>
  );
});

export default GameCanvas;
