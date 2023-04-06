let map;
let debounceTimer;

function initMap() {
  let clickTimeout; // Declare the timeout variable
  let isDoubleClick = false; // Declare a flag to check if the event is a double-click
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 51.5098, lng: -0.1180 },
    zoom: 5,
  });

  // Display the initial zoom level
  updateZoomLevelIndicator();

  
  google.maps.event.addListener(map, "zoom_changed", () => {
    updateZoomLevelIndicator(); //Update zoom level indicator
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (map.getZoom() >= 17) {
        populateTableWithVisibleStreets();
      } else {
        clearTable();
      }
    }, 1500); // Adjust the debounce time in milliseconds as needed
  });
  
  google.maps.event.addListener(map, "bounds_changed", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (map.getZoom() >= 17) {
        populateTableWithVisibleStreets();
      } else {
        clearTable();
      }
    }, 1500); // Adjust the debounce time in milliseconds as needed
  });

  // Add click event listener to the map
  map.addListener('click', async (event) => {
    clearTimeout(clickTimeout); // Clear the timeout

    clickTimeout = setTimeout(async () => {
      if (!isDoubleClick) {
        const clickedLatLng = event.latLng;
        const streetViewService = new google.maps.StreetViewService();
        streetViewService.getPanoramaByLocation(clickedLatLng, 30, (data, status) => {
          if (status === google.maps.StreetViewStatus.OK) {
            const imageDate = data.imageDate;
            showPopup(clickedLatLng, imageDate, status);
          } else {
            showPopup(clickedLatLng, null, status);
            console.error('Error fetching Street View image date for clicked location:', status);
          }
        });
      }
    }, 300); // Set the timeout to 300 ms or any other value suitable for your use case
  });

  // Add dblclick event listener
  map.addListener('dblclick', (event) => {
    clearTimeout(clickTimeout); // Clear the timeout
    isDoubleClick = true; // Set the flag to true

    // Reset the flag after a short period
    setTimeout(() => {
      isDoubleClick = false;
    }, 300); // Set the timeout to 300 ms or any other value suitable for your use case
  });

  document.getElementById('toggle-pois').addEventListener('click', togglePOIs);

  
  const searchBox = document.getElementById("search-box");
  searchBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchLocation(searchBox.value);
    }
  });

  
}

function updateZoomLevelIndicator() {
  const zoomLevelElement = document.getElementById("zoom-level");
  const zoomLevelContainer = document.getElementById("zoom-level-container");
  const zoomLevel = map.getZoom();
  zoomLevelElement.textContent = zoomLevel;

  if (zoomLevel >= 17) {
    zoomLevelContainer.classList.add("hidden");
  } else {
    zoomLevelContainer.classList.remove("hidden");
  }
}
    
async function populateTableWithVisibleStreets() {
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const bounds = map.getBounds();
  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();

  const overpassQuery = `
    [out:json][timeout:25];
    (
      way[highway][name](${southWest.lat()},${southWest.lng()},${northEast.lat()},${northEast.lng()});
    );
    out body;
  `;

  const overpassApiUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery.trim())}`;

  fetch(overpassApiUrl)
    .then((response) => {
      // Reset progress bar
      progressBar.value = 0;
      progressText.innerText = "populating table...";
      return response.json();
    })
    .then((data) => {
      const streetNames = data.elements
        .filter((element) => element.tags && element.tags.name)
        .map((element) => element.tags.name);
      const uniqueStreetNames = [...new Set(streetNames)];
      uniqueStreetNames.sort();

      // Calculate the increment for each street in the progress bar
      const increment = 100 / uniqueStreetNames.length;

      populateTable(uniqueStreetNames, increment);
    })
    .catch((error) => {
      console.error('Error fetching street names:', error);
    });
}


async function populateTable(streetNames, increment) {
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const table = document.getElementById("info-table");

  // Clear the table before populating it
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }

  for (const streetName of streetNames) {
    const row = table.insertRow();
    const cell1 = row.insertCell();
    cell1.textContent = streetName;

    cell1.style.cursor = "pointer"; // Change cursor to pointer when hovering over the street name

    cell1.addEventListener("click", async () => {
      try {
        const streetLatLng = await geocodeStreet(streetName);
        const latLng = new google.maps.LatLng(streetLatLng.lat, streetLatLng.lng);

        // Remove existing marker if any
        if (window.streetMarker) {
          window.streetMarker.setMap(null);
        }

        // Create and place a new marker on the map
        window.streetMarker = new google.maps.Marker({
          position: latLng,
          map: map,
        });

        // Ensure the marker is within the current map view
        if (!map.getBounds().contains(latLng)) {
          // Center the map on the marker
          map.setCenter(latLng);
        }

      } catch (error) {
        console.error(`Error placing marker for ${streetName}:`, error);
      }
    });

    // Fetch and display the Street View image date
    await populateRowWithStreetViewImageDate(row, streetName);

    // Update the progress bar
    progressBar.value += increment;
  }

  progressBar.value = 100;
  progressText.innerText = "complete";
}

async function populateRowWithStreetViewImageDate(row, streetName) {
  try {
    const streetLatLng = await geocodeStreet(streetName);
    const latLng = new google.maps.LatLng(streetLatLng.lat, streetLatLng.lng);
    const streetViewService = new google.maps.StreetViewService();
    streetViewService.getPanoramaByLocation(latLng, 20, (data, status) => {
      if (status === google.maps.StreetViewStatus.OK) {
        const imageDate = data.imageDate;
        const cell2 = row.insertCell(1);
        cell2.textContent = imageDate;
      } else {
        const cell2 = row.insertCell(1);
        cell2.textContent = 'No imagery here';
        console.error(`Error fetching Street View image date for ${streetName}: ${status}`);
      }
    });
  } catch (error) {
    console.error(`Error fetching Street View image date for ${streetName}:`, error);
  }
}



async function geocodeStreet(streetName, apiKey, maxRetries = 5, retryDelay = 250) {
  const geocoder = new google.maps.Geocoder();
  const request = {
    address: streetName,
    bounds: map.getBounds(),
  };

  const geocodeWithRetry = (resolve, reject, retriesRemaining, delay) => {
    geocoder.geocode(request, (results, status) => {
      if (status === "OK") {
        const latLng = results[0].geometry.location;
        resolve({ lat: latLng.lat(), lng: latLng.lng() });
      } else if (status === "OVER_QUERY_LIMIT" && retriesRemaining > 0) {
        // Apply exponential backoff
        setTimeout(() => {
          geocodeWithRetry(resolve, reject, retriesRemaining - 1, delay * 2);
        }, delay);
      } else {
        reject(new Error(`Geocoding failed for ${streetName}: ${status}`));
      }
    });
  };

  return new Promise((resolve, reject) => {
    geocodeWithRetry(resolve, reject, maxRetries, retryDelay);
  });
}

    
function clearTable() {
  const table = document.getElementById("info-table");

  if (table) {
    // Clear the table
    while (table.rows.length > 1) {
      table.deleteRow(1);
    }

    // Add a message when zoom level is below 17
    const row = table.insertRow();
    const cell = row.insertCell();
    cell.textContent = "Zoom in (level 17 or more) to see data!";
    cell.colSpan = 2; // Span the message across both columns
    cell.style.textAlign = "center";
  }
}

async function fetchStreets(center, radius) {
  const overpassApiUrl = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:25];(way[highway](around:${radius},${center.lat()},${center.lng()}));(._;>;);out body;`;
  const response = await fetch(overpassApiUrl);
  const data = await response.json();
  const streets = data.elements.filter(element => element.type === "way");
  const nodes = data.elements.filter(element => element.type === "node");

  const midPoints = streets.map(street => {
    const streetNodes = street.nodes.map(nodeId => nodes.find(node => node.id === nodeId));
    const midIndex = Math.floor((streetNodes.length - 1) / 2);
    const midPoint = {
      lat: streetNodes[midIndex].lat,
      lon: streetNodes[midIndex].lon
    };
    return midPoint;
  });

  console.log(midPoints);
}

function showPopup(latLng, imageDate, status) {
  // Close the existing InfoWindow if any
  if (window.infoWindow) {
    window.infoWindow.close();
  }

  // Set the content of the InfoWindow based on the availability of Street View data
  const content = status === google.maps.StreetViewStatus.OK
    ? `Street View image date: ${imageDate}`
    : 'No Street View data available for this location';

  // Create a new InfoWindow
  window.infoWindow = new google.maps.InfoWindow({
    content,
    position: latLng,
  });

  // Open the InfoWindow at the clicked location
  window.infoWindow.open(map);
}

async function searchLocation(location) {
  try {
    const geocoder = new google.maps.Geocoder();
    const request = { address: location };

    geocoder.geocode(request, (results, status) => {
      if (status === "OK") {
        const latLng = results[0].geometry.location;
        map.setCenter({ lat: latLng.lat(), lng: latLng.lng() });
        map.setZoom(18);
      } else {
        console.error(`Search failed for ${location}: ${status}`);
      }
    });
  } catch (error) {
    console.error(`Error searching for ${location}:`, error);
  }
}

 function togglePOIs() {
  const currentStyles = map.get('styles');
  const newStyles = currentStyles
    ? null
    : [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ];

  map.set('styles', newStyles);
}
   
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}