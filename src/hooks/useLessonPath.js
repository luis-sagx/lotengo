// saflash — Loads the guided lesson path.
import { useCallback, useRef, useState } from 'react';
import { getCurrentLesson, getPath } from '../database/lessonsRepository';
import { getConfig } from '../database/sessionRepository';
import { LEVELS } from '../utils/levels.mjs';

export function useLessonPath() {
  const [units, setUnits] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [config, setConfig] = useState(null);
  const [visibleLevel, setVisibleLevel] = useState(null);
  const [unitsLevel, setUnitsLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const configLevelRef = useRef(null);
  const visibleLevelRef = useRef(null);
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++requestRef.current;
    try {
      setError(null);
      const [cfg, current] = await Promise.all([getConfig(), getCurrentLesson()]);
      const selectedLevel = LEVELS.includes(cfg?.level) ? cfg.level : 'A1';
      const level = !visibleLevelRef.current || configLevelRef.current !== selectedLevel
        ? selectedLevel
        : visibleLevelRef.current;
      const path = await getPath(level);
      if (request !== requestRef.current) return;
      configLevelRef.current = selectedLevel;
      visibleLevelRef.current = level;
      setUnits(path);
      setUnitsLevel(level);
      setCurrentLesson(current);
      setConfig(cfg);
      setVisibleLevel(level);
    } catch (err) {
      if (request !== requestRef.current) return;
      console.error('Error loading lesson path:', err);
      setError('No se pudo cargar la ruta.');
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, []);

  const showLevel = useCallback(async level => {
    if (!LEVELS.includes(level) || level === visibleLevelRef.current) return;
    const request = ++requestRef.current;
    visibleLevelRef.current = level;
    setVisibleLevel(level);
    setError(null);
    try {
      const path = await getPath(level);
      if (request === requestRef.current) {
        setUnits(path);
        setUnitsLevel(level);
      }
    } catch (err) {
      if (request !== requestRef.current) return;
      console.error('Error loading lesson path:', err);
      setError('No se pudo cargar la ruta.');
    }
  }, []);

  return { units, unitsLevel, currentLesson, config, visibleLevel, loading, error, refresh, showLevel };
}
