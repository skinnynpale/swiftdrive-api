import { getRhumbLineBearing } from 'geolib';

// симуляция движения
export const getNextPoint = (
  roads: [number, number][][],
  directions: number[],
  currentPoint: [number, number],
) => {
  let nearestPoint: number;

  const nearestRoad = roads.findIndex((r) => {
    const pointIndex = r.findIndex(
      (p) => p[0] === currentPoint[0] && p[1] === currentPoint[1],
    );
    if (pointIndex === -1) {
      return false;
    }
    nearestPoint = pointIndex;
    return true;
  });

  if (
    (nearestPoint === roads[nearestRoad].length - 1 &&
      directions[nearestRoad] === 1) ||
    (nearestPoint === 0 && directions[nearestRoad] === -1)
  ) {
    // если достигнут конец дороги, меняем направление
    directions[nearestRoad] *= -1;
  }

  const nextPoint = roads[nearestRoad][nearestPoint + directions[nearestRoad]];

  const bearing = getRhumbLineBearing(
    { latitude: currentPoint[0], longitude: currentPoint[1] },
    { latitude: nextPoint[0], longitude: nextPoint[1] },
  );

  return {
    nextPoint,
    bearing,
  };
};
