document.addEventListener("DOMContentLoaded", function() {
    fetch('assets/data/data.json')
    .then(response => response.json())
    .then(data => {
        var unionSquareData = data.UnionSquareNoiseData.location;
        var noiseEvents = data.UnionSquareNoiseData.noiseEvents;

        var map = new ol.Map({
            target: 'map',
            controls: ol.control.defaults({
                attribution: false,
                rotate: false,
                zoom: false
            }),
            interactions: [],
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([unionSquareData.longitude, unionSquareData.latitude]),
                zoom: 19,
                rotation: 331 * (Math.PI / 180)
            })
        });

        var eventTypeColorMap = {
            "Construction": [255, 102, 102],
            "Traffic": [178, 102, 178],
            "Subway": [179, 183, 187],
            "Street Vendors": [255, 195, 77],
            "Nightlife": [255, 155, 210],
            "People": [255, 252, 235],
            "City Services": [77, 77, 77]
        };

        var vectorSource = new ol.source.Vector();
        var originalFeatures = {};
        var filterState = {
            "Construction": true,
            "Traffic": true,
            "Subway": true,
            "Street Vendors": true,
            "Nightlife": true,
            "People": true,
            "City Services": true
        };

        noiseEvents.forEach(function(noiseEvent) {
            if (!originalFeatures[noiseEvent.type]) {
                originalFeatures[noiseEvent.type] = [];
            }

            noiseEvent.locations.forEach(function(noiseLocation) {
                if (!noiseLocation.longitude || !noiseLocation.latitude) {
                    return;
                }

                var decibelLevel = noiseEvent.decibelLevel;
                var baseColor = eventTypeColorMap[noiseEvent.type] || [0, 0, 0];

                for (var i = 1; i <= 3; i++) {
                    var radiusMultiplier, transparency;
                    switch (i) {
                        case 1:
                            radiusMultiplier = 0.26;
                            transparency = 0.4;
                            break;
                        case 2:
                            radiusMultiplier = 0.40;
                            transparency = 0.3;
                            break;
                        case 3:
                            radiusMultiplier = 0.5;
                            transparency = 0.1;
                            break;
                    }

                    var radius = radiusMultiplier * decibelLevel;
                    var color = 'rgba(' + baseColor.join(',') + ',' + transparency + ')';

                    var noiseCircle = new ol.Feature({
                        geometry: new ol.geom.Circle(ol.proj.fromLonLat([parseFloat(noiseLocation.longitude), parseFloat(noiseLocation.latitude)]), radius)
                    });

                    noiseCircle.setStyle(new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: color
                        })
                    }));

                    noiseCircle.set('type', noiseEvent.type);
                    originalFeatures[noiseEvent.type].push(noiseCircle);
                }
            });
        });

        function updateEventVisibility() {
            vectorSource.clear();
            Object.keys(filterState).forEach(function(eventType) {
                if (filterState[eventType]) {
                    vectorSource.addFeatures(originalFeatures[eventType]);
                }
            });
        }

        document.querySelectorAll('#filter-controls input[type="checkbox"]').forEach(function(checkbox) {
            checkbox.addEventListener('change', function() {
                filterState[this.value] = this.checked;
                updateEventVisibility();
            });
        });

        var vectorLayer = new ol.layer.Vector({
            source: vectorSource
        });

        map.addLayer(vectorLayer);

        updateEventVisibility();
    })
    .catch(error => console.error('Error loading JSON data:', error));
});
