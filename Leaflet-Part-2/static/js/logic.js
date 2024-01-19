// Earthquake geoJSON data for the last week
let queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
let plateDataUrl = "https://koskadelli.github.io/Earthquake-data/PB2002_boundaries.json";

// Perform a GET request to the query URL
d3.json(queryUrl).then(function (data) {
  // Once we get a response, send the data.features object to the createFeatures function.
  createFeatures(data.features);
});

// Define a function to determine the color based on depth
function getColor(depth) {
  // Customize this logic based on your depth values
  return depth > 200 ? '#F30' :
         depth > 100 ? '#F60' :
         depth > 50 ? '#F90' :
         depth > 10 ? '#FC0' :
                      '#9F3';
}

function createFeatures(earthquakeData) {

  // Define a function to determine the circle style based on depth
  function getCircleStyle(feature) {
    return {
      radius: feature.properties.mag * 5, // Adjust the multiplier for custom size (you can use feature.properties.mag or any other property)
      fillColor: getColor(feature.geometry.coordinates[2]), // Call a function to determine color based on depth
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };
  }

  // Define a function that we want to run once for each feature in the features array.
  // Give each feature a circle marker with custom style.
  function onEachFeature(feature, layer) {
    layer.bindPopup(`<h3>${feature.properties.place}</h3><hr><p>${new Date(feature.properties.time)}<br/><br/>Magnitude: ${feature.properties.mag}<br/><br/>Depth: ${feature.geometry.coordinates[2]} m</p>`);
  }

  // Create a GeoJSON layer that contains the features array on the earthquakeData object.
  // Run the onEachFeature function once for each piece of data in the array.
  let earthquakes = L.geoJSON(earthquakeData, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, getCircleStyle(feature));
    },
    onEachFeature: onEachFeature
  });

  // Create our map with earthquakes layer
  createMap(earthquakes);
}

function createMap(earthquakes) {

  // Create the base layers.
  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  // Create an Esri World Imagery layer
  let esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri'
  });

  // Create a baseMaps object.
  let baseMaps = {
    "Street Map": street,
    "Satellite": esriSatellite
  };
  
  // Fetch the plateData GeoJSON
  d3.json(plateDataUrl).then(function(data) {
    // Creating a GeoJSON layer with the retrieved data
    let plateDataLayer = L.geoJson(data, {
      style: {
        color: "#FF5733", // Change the color of the plate boundaries
        weight: 2
      }
    });

    // Add plateDataLayer to the overlayMaps with the key "Plate Boundaries"
    let overlayMaps = {
      "Earthquakes": earthquakes,
      "Plate Boundaries": plateDataLayer
    };

    // Create our map, giving it the streetmap and earthquakes layers to display on load.
    let myMap = L.map("map", {
      center: [0, 0],
      zoom: 2.4,
      layers: [esriSatellite, earthquakes, plateDataLayer]
    });

    // Create a layer control.
    // Pass it our baseMaps and overlayMaps.
    // Add the layer control to the map.
    L.control.layers(baseMaps, overlayMaps, {
      collapsed: false
    }).addTo(myMap);

    // Create a custom legend control and add it to the map
    let legend = L.control({ position: 'bottomright' });

    legend.onAdd = function () {
      let div = L.DomUtil.create('div', 'info legend');
      let grades = [0, 10, 50, 100, 200];
      let labels = [];

      // Add title to the legend
      div.innerHTML += '<h4>Earthquake Depth</h4>';

      // Create the legend components
      for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
          '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
          grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + ' m<br>' : '+ m');
      }

      return div;
    };

    legend.addTo(myMap);
  });
}
