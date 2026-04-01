'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface PixelSpriteProps {
  id: string;
  name: string;
  bodyColor: string;
  x: number;
  y: number;
  isActive: boolean;
  isWalking: boolean;
  isWaiting?: boolean;
  facing?: 'left' | 'right' | 'back';
  carrying?: boolean;
  speech?: string | null;
  title?: string;
}

/* Sprite sheet layout: 256×128, 32×32 cells
   8 columns (walk frames), 4 rows (front/back/left/right)
   Row 0 = front (facing camera), 1 = back, 2 = left, 3 = right
   Frame 0 = idle standing pose */

const SCALE = 3;
const CELL = 32;
const COLS = 8;
const FRAME_PX = CELL * SCALE;           // 96
const SHEET_W = CELL * COLS * SCALE;     // 768
const SHEET_H = CELL * 4 * SCALE;       // 384
const WALK_FPS = 150; // ms per frame

const spriteFile: Record<string, string> = {
  planner:    '/sprites/alexis.png',
  reviewer:   '/sprites/brad.png',
  coder:      '/sprites/carlos.png',
  tester:     '/sprites/dana.png',
  supervisor: '/sprites/sal.png',
};

const dirRow: Record<string, number> = {
  right: 2,
  left:  3,
  back:  1,
  front: 0,
};

export function PixelSprite({
  id, name, bodyColor, x, y,
  isActive, isWalking, isWaiting = false,
  facing = 'right', carrying = false, speech = null, title,
}: PixelSpriteProps) {
  const [frame, setFrame] = useState(0);
  const [moving, setMoving] = useState(false);

  // Start moving when position changes
  useEffect(() => {
    if (dist < 5) return;
    setMoving(true);
  }, [x, y]); // eslint-disable-line react-hooks/exhaustive-deps

  // Walk animation: cycle frames only while physically moving
  useEffect(() => {
    if (!moving) { setFrame(0); return; }
    const iv = setInterval(() => setFrame(f => (f + 1) % COLS), WALK_FPS);
    return () => clearInterval(iv);
  }, [moving]);

  const row = dirRow[facing] ?? 0;
  const bgX = -frame * FRAME_PX;
  const bgY = -row * FRAME_PX;
  const src = spriteFile[id] || spriteFile.coder;

  // Scale transition duration by distance (~4s per 500px)
  const prevPos = useRef({ x, y });
  const dist = Math.hypot(x - prevPos.current.x, y - prevPos.current.y);
  const moveDuration = Math.max(2, (dist / 500) * 5);
  useEffect(() => { prevPos.current = { x, y }; }, [x, y]);

  return (
    <>
      {/* Character sprite — z-20, behind furniture */}
      <motion.div
        className="absolute"
        style={{ width: FRAME_PX, height: FRAME_PX, transform: 'translate(-50%, -100%)', zIndex: 20 }}
        animate={{ left: x, top: y }}
        transition={{ duration: moveDuration, ease: 'easeInOut' }}
        onAnimationComplete={() => setMoving(false)}
      >
        <motion.div
          className="relative"
          style={{ width: FRAME_PX, height: FRAME_PX }}
          animate={
            moving
              ? { y: [0, -3, 0, -3, 0] }
              : isActive
              ? { y: [0, -1.5, 0] }
              : { y: [0, -0.5, 0] }
          }
          transition={{
            duration: moving ? 0.56 : isActive ? 1.0 : 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <motion.div
            className="absolute bottom-0 left-1/2 h-[6px] w-10 -translate-x-1/2 rounded-full bg-black/30 blur-[2px]"
            style={{ display: facing === 'back' && !isWalking ? 'none' : undefined }}
            animate={
              moving
                ? { scaleX: [0.8, 1.3, 0.8], scaleY: [1.2, 0.8, 1.2] }
                : { scaleX: [1, 1.05, 1] }
            }
            transition={{
              duration: moving ? 0.56 : 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <div
            style={{
              width: FRAME_PX,
              height: FRAME_PX,
              backgroundImage: `url(${src})`,
              backgroundSize: `${SHEET_W}px ${SHEET_H}px`,
              backgroundPosition: `${bgX}px ${bgY}px`,
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            }}
          />
          {isActive && (
            <motion.div
              className="absolute -right-1 top-[30%] h-3 w-3 rounded-full"
              style={{ backgroundColor: bodyColor, boxShadow: `0 0 6px ${bodyColor}` }}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {isWaiting && (
            <motion.div
              className="absolute left-1/2 top-[8px] flex -translate-x-1/2 gap-[2px]"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="h-[3px] w-[3px] rounded-full bg-white/60" />
              <div className="h-[3px] w-[3px] rounded-full bg-white/60" />
              <div className="h-[3px] w-[3px] rounded-full bg-white/60" />
            </motion.div>
          )}
          {carrying && (
            <motion.div
              className="absolute -right-2 top-[50%] h-5 w-4 rounded-[2px] border border-[#6c5a43] bg-[#efe4cf]"
              animate={{ y: [0, -1, 0], rotate: [0, 4, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="absolute inset-x-[18%] top-[18%] h-[6%] rounded-full bg-[#b8aea0]" />
              <div className="absolute inset-x-[18%] top-[34%] h-[6%] rounded-full bg-[#b8aea0]" />
              <div className="absolute inset-x-[18%] top-[50%] h-[6%] rounded-full bg-[#b8aea0]" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Speech bubble — separate z-50 layer, above all furniture */}
      {speech && (
        <motion.div
          className="absolute"
          style={{ transform: 'translate(-50%, -100%)', zIndex: 50 }}
          initial={{ left: x, top: y }}
          animate={{ left: x, top: y }}
          transition={{ duration: moveDuration, ease: 'easeInOut' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -3, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-[100px] left-[calc(50%-105px)] rounded-lg border border-white/15 bg-black/85 px-3.5 py-2.5 text-[13px] leading-snug text-white backdrop-blur-sm"
            style={{ width: 210 }}
          >
            {speech}
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-black/85" />
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
