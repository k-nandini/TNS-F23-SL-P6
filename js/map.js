const mapboxAccessToken = document.querySelector('meta[name="mapbox-token"]').getAttribute('content');
mapboxgl.accessToken = mapboxAccessToken;

async function loadNoiseData() {
  try {
    const response = await fetch('assets/data/data.json');
    const jsonData = await response.json();
    initializeMap(jsonData.UnionSquareNoiseData);
  } catch (error) {
    console.error('Error loading the JSON data: ', error);
  }
}

function initializeMap(noiseData) {
  mapboxgl.accessToken = mapboxAccessToken;
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/kuman293/clonlclap009b01qofndpfsy0',
    center: [noiseData.location.longitude, noiseData.location.latitude],
    zoom: 18,
    bearing: -331,
    interactive: false,
    attributionControl: false
  });

  map.on('load', () => {
    addNoiseEventLayers(map, noiseData.noiseEvents);
  });
}

function addNoiseEventLayers(map, noiseEvents) {
  noiseEvents.forEach((event, eventIndex) => {
    event.locations.forEach((location, locationIndex) => {
      const sourceId = `source-${eventIndex}-${locationIndex}`;
      const eventTypeColor = getEventTypeColor(event.type);

      const featureData = createFeatureData(location, event.decibelLevel);

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          'type': 'geojson',
          'data': featureData
        });
      }

      addEventLayers(map, sourceId, eventTypeColor, eventIndex, locationIndex);
    });
  });
}

function createFeatureData(location, decibelLevel) {
  return {
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [location.longitude, location.latitude]
    },
    'properties': {
      'decibelLevel': decibelLevel
    }
  };
}

function addEventLayers(map, sourceId, eventTypeColor, eventIndex, locationIndex) {
  const circles = [
    { radiusMultiplier: 0.26, opacity: 0.5 },
    { radiusMultiplier: 0.52, opacity: 0.3 },
    { radiusMultiplier: 1.04, opacity: 0.1 }
  ];

  circles.forEach((circle, index) => {
    const layerId = `layer-${eventIndex}-${locationIndex}-${index}`;
    map.addLayer({
      'id': layerId,
      'type': 'circle',
      'source': sourceId,
      'paint': {
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          10, ['*', ['get', 'decibelLevel'], circle.radiusMultiplier],
          18, ['*', ['get', 'decibelLevel'], circle.radiusMultiplier * 2]
        ],
        'circle-color': eventTypeColor,
        'circle-opacity': circle.opacity
      }
    });
  });
}

function getEventTypeColor(eventType) {
  const eventColors = {
    'Construction': '#FF6666',
    'Traffic': '#B266B2',
    'Subway': '#B3B7BB',
    'Street Vendors': '#FFC34D',
    'Nightlife': '#FF9BD2',
    'People': '#FFFCEB',
    'City Services': '#4D4D4D'
  };
  // Changed default color to a more visible one
  return eventColors[eventType] || '#AAAAAA';
}

// Call the function to load and display the noise data
loadNoiseData();
