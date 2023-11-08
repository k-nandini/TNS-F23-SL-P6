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
    setupTimeSlider(map, noiseData.noiseEvents);
    setupMapKeyCheckboxes(map, noiseData.noiseEvents);
  });
}

function addNoiseEventLayers(map, noiseEvents) {
  map._noiseEventLayers = {};

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

function addEventLayers(map, sourceId, eventTypeColor, eventIndex, locationIndex) {
  const circles = [
    { radiusMultiplier: 0.26, opacity: 0.5 },
    { radiusMultiplier: 0.52, opacity: 0.3 },
    { radiusMultiplier: 1.04, opacity: 0.1 }
  ];

  circles.forEach((circle, index) => {
    const layerId = `layer-${eventIndex}-${locationIndex}-${index}`;
    if (!map.getLayer(layerId)) {
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

      if (!map._noiseEventLayers[eventIndex]) {
        map._noiseEventLayers[eventIndex] = [];
      }
      map._noiseEventLayers[eventIndex].push(layerId);
    }
  });
}

function setupTimeSlider(map, noiseEvents) {
  const timeSlider = document.getElementById('timeSlider');
  const timeSliderValue = document.getElementById('timeSliderValue');
  
  timeSliderValue.textContent = formatTime(timeSlider.value) + ':00';

  timeSlider.addEventListener('input', () => {
    const timeValue = timeSlider.value;
    timeSliderValue.textContent = formatTime(timeValue) + ':00';
    updateMapForTime(map, noiseEvents, formatTime(timeValue));
  });
}

function updateMapForTime(map, noiseEvents, sliderTime) {
  const selectedEventTypes = getSelectedEventTypes();
  noiseEvents.forEach((event, eventIndex) => {
    const isVisible = isEventVisible(event, sliderTime) && selectedEventTypes.includes(event.type.toLowerCase());

    const layerIds = map._noiseEventLayers[eventIndex];
    if (layerIds) {
      layerIds.forEach(layerId => {
        map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
      });
    }
  });
}

function setupMapKeyCheckboxes(map, noiseEvents) {
  const checkboxes = document.querySelectorAll('input[name="mapKey"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateMapForTime(map, noiseEvents, formatTime(document.getElementById('timeSlider').value));
    });
  });
}

function getSelectedEventTypes() {
  const checkboxes = document.querySelectorAll('input[name="mapKey"]:checked');
  return Array.from(checkboxes).map(checkbox => checkbox.value);
}

function isEventVisible(event, sliderTime) {
  return event.time.some(timeSlot =>
    sliderTime >= timeSlot.startTime && sliderTime <= timeSlot.endTime
  );
}

function formatTime(time) {
  return `${String(time).padStart(2, '0')}:00`;
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
  return eventColors[eventType] || '#AAAAAA';
}

loadNoiseData();
