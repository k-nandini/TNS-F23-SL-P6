document.addEventListener("DOMContentLoaded", function() {
    fetch('data/data.json')
    .then(response => response.json())
    .then(data => {
        var unionSquareData = data.UnionSquareNoiseData.location;
        var noiseEvents = data.UnionSquareNoiseData.noiseEvents;

        // Create the map OpenLayers
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
                rotation:  331 * (Math.PI / 180)
            })
        });

        // Define a color map for event types
        var eventTypeColorMap = {
            "Construction": [255, 102, 102], // Red
            "Traffic": [178, 102, 178], // Purple
            "Subway": [179, 183, 187], // Grey
            "Street Vendors": [255, 195, 77], // Orange
            "Nightlife": [255, 155, 210], // Pink
            "People": [255, 252, 235], // Yellow
            "City Services": [77, 77, 77] // Black 
        };

        // Create a vector source to hold all noise event features
        var vectorSource = new ol.source.Vector();

        // Iterate over all noise events and create circles for each location
        noiseEvents.forEach(function(noiseEvent) {
            noiseEvent.locations.forEach(function(noiseLocation) {
                // Skip if longitude or latitude is missing
                if (!noiseLocation.longitude || !noiseLocation.latitude) {
                    return;
                }

                var decibelLevel = noiseEvent.decibelLevel;
                var baseColor = eventTypeColorMap[noiseEvent.type] || [0, 0, 0]; // Default to black if type not found

                // Create three circles with different transparencies and radii
                for (var i = 1; i <= 3; i++) {
                    var radiusMultiplier, transparency;
                    switch (i) {
                        case 1:
                            radiusMultiplier = 0.26;
                            transparency = 0.4; // 100%
                            break;
                        case 2:
                            radiusMultiplier = 0.40;
                            transparency = 0.3; // 50%
                            break;
                        case 3:
                            radiusMultiplier = 0.5;
                            transparency = 0.1; // 20%
                            break;
                    }

                    var radius = radiusMultiplier * decibelLevel;
                    var color = 'rgba(' + baseColor.join(',') + ',' + transparency + ')'; // Construct the RGBA color

                    var noiseCircle = new ol.Feature({
                        geometry: new ol.geom.Circle(ol.proj.fromLonLat([parseFloat(noiseLocation.longitude), parseFloat(noiseLocation.latitude)]), radius)
                    });

                    // Define the style for the circle
                    noiseCircle.setStyle(new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: color // Color based on event type and transparency
                        })
                    }));

                    // Add the circle feature to the vector source
                    vectorSource.addFeature(noiseCircle);
                }
            });
        });

        // Create a vector layer with the vector source and add it to the map
        var vectorLayer = new ol.layer.Vector({
            source: vectorSource
        });

        map.addLayer(vectorLayer);
    })
    .catch(error => console.error('Error loading JSON data:', error));
});