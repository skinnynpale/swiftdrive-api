ymaps.ready(init);
let myMap = null;

let lastPicks = [];
let currentRequest = null;
let currentCarsPlacemarks = {};

const CARS = 5;
const UPDATE_INTERVAL_TIME = 3000;
const RADIUS = 500;

function init() {
  myMap = new ymaps.Map('map', {
    center: [55.76, 37.64],
    zoom: 17,
  });

  myMap.events.add('click', function (e) {
    const coords = e.get('coords');
    const myPlacemark = new ymaps.Placemark(
      coords,
      {},
      {
        preset: 'islands#redIcon',
      },
    );
    myMap.geoObjects.add(myPlacemark);
    lastPicks.push(myPlacemark);
    myMap.setCenter(coords, 16, { duration: 500 });

    fetchCars(coords);
  });

  setInterval(async () => {
    updateCarsLocations();
  }, UPDATE_INTERVAL_TIME);
}

const updateCarsLocations = async () => {
  if (currentRequest) {
    const res = await fetch('http://localhost:3000/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reqId: currentRequest.reqId,
      }),
    }).then((res) => res.json());

    res.cars.forEach((car) => {
      myMap.geoObjects.remove(currentCarsPlacemarks[car.id]);

      var animatedLayout = ymaps.templateLayoutFactory.createClass(
        `<div class="car placemark-${car.id}"></div>`,
        {
          build: function () {
            animatedLayout.superclass.build.call(this);
            var element = this.getParentElement().getElementsByClassName(
              `placemark-${car.id}`,
            )[0];
            element.style.transform = 'rotate(' + car.bearing + 'deg)';
          },
        },
      );

      const placemark = new ymaps.Placemark(
        car.currentCoords,
        {
          iconCaption: '',
        },
        {
          iconLayout: animatedLayout,
        },
      );

      currentCarsPlacemarks[car.id] = placemark;
      myMap.geoObjects.add(placemark);
    });

    console.log(res);
  }
};

const fetchCars = async (coords) => {
  const res = await fetch('http://localhost:3000/cars', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lat: coords[0],
      lon: coords[1],
      radius: RADIUS,
      neededCarsCount: CARS,
    }),
  }).then((res) => res.json());

  currentRequest = res;

  Object.values(currentCarsPlacemarks).forEach((placemark) => {
    myMap.geoObjects.remove(placemark);
  });
  currentCarsPlacemarks = {};

  lastPicks.slice(0, -1).forEach((p) => {
    myMap.geoObjects.remove(p);
  });
  lastPicks = lastPicks.slice(-1);

  myMap.setCenter(coords, 16, { duration: 500 });
  updateCarsLocations();
};
