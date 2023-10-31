import { Body, Controller, Get, Post } from '@nestjs/common';
import { flatten, pullAt, random, uniqueId } from 'lodash';
import fetch from 'node-fetch';
import { getNextPoint } from './utils/coordinates';

const availableCarsInfoDb: {
  [key: string]: {
    cars: Car[];
    allNearestRoads: [number, number][][];
  };
} = {};

type Car = {
  id: string;
  currentCoords: [number, number];
  bearing: number;
  directions: number[];
};

@Controller('cars')
export class CarsController {
  @Post()
  async getAvailableCars(
    @Body()
    body: {
      lat?: number;
      lon?: number;
      radius?: number;
      neededCarsCount?: number;
      reqId?: string;
    },
  ) {
    const { lat, lon, radius = 500, neededCarsCount = 5, reqId } = body;

    if (reqId) {
      const carsInfo = availableCarsInfoDb[reqId];
      if (!carsInfo) return;

      carsInfo.cars.forEach((car) => {
        const nextPoint = getNextPoint(
          carsInfo.allNearestRoads,
          car.directions,
          car.currentCoords,
        );
        car.currentCoords = nextPoint.nextPoint;
        car.bearing = nextPoint.bearing;
      });

      return { cars: availableCarsInfoDb[reqId].cars, reqId: reqId };
    }

    const query = `
      [out:json];
      way(around:${radius}, ${lat}, ${lon})["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential)$"];
      (._;>;);
      out;
    `;

    const data = await fetch(
      `http://overpass-api.de/api/interpreter?data=${encodeURIComponent(
        query,
      )}`,
    )
      .then((res: any) => res.json())
      .then((data) => {
        if (!data.elements.length) {
          throw new Error('No roads found');
        }
        return data;
      })
      .catch((err) => {
        console.error('Error: ', err);
      });

    const nearestRoads = data.elements.filter((el) => el.type === 'way');

    if (nearestRoads.length) {
      const allNearestRoads: [number, number][][] = nearestRoads.map((road) => {
        // ищем и выводим координаты точек, составляющих дорогу
        const coords = road.nodes
          .map((nodeId) => {
            const node = data.elements.find(
              (el) => el.type === 'node' && el.id === nodeId,
            );
            return node ? [node.lat, node.lon] : null;
          })
          .filter(Boolean);

        return coords;
      });

      const cars: Car[] = [];
      const flattenRoads = flatten(allNearestRoads);

      for (let i = 0; i < neededCarsCount; i++) {
        const index = random(0, flattenRoads.length - 1);
        const el = flattenRoads[index];
        const directions = new Array(flattenRoads.length).fill(1);
        cars.push({
          id: uniqueId(),
          currentCoords: el,
          bearing: 0,
          directions,
        });
        pullAt(flattenRoads, index);
      }

      const reqId = uniqueId();
      const result = { cars, reqId };
      availableCarsInfoDb[reqId] = { ...result, allNearestRoads };

      return result;
    } else {
      console.log('No roads found');
      return [];
    }
  }

  @Get('db')
  getDb() {
    return availableCarsInfoDb;
  }
}
