import axios from 'axios';

// Using free, open-source routing APIs that do not require an API key
const ROUTING_BASE_URL = 'https://router.project-osrm.org';
const GEOCODE_BASE_URL = 'https://nominatim.openstreetmap.org';

export const getRouteData = async (start, end) => {
    try {
        // start and end arrive as [lat, lng]
        // OSRM expects coordinates in lng,lat format
        const coordinates = `${start[1]},${start[0]};${end[1]},${end[0]}`;

        const response = await axios.get(`${ROUTING_BASE_URL}/route/v1/driving/${coordinates}`, {
            params: {
                overview: 'full', // Request the full route polyline
                geometries: 'geojson' // Return as GeoJSON coordinates
            }
        });

        if (response.data.code === 'Ok' && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            return {
                distance: (route.distance / 1000).toFixed(2), // OSRM returns meters -> convert to km
                duration: (route.duration / 60).toFixed(0), // OSRM returns seconds -> convert to mins
                geometry: route.geometry?.coordinates // Array of [lng, lat]
            };
        }
        throw new Error("No route found between coordinates.");
    } catch (error) {
        console.error("OSRM Routing error:", error);
        throw error;
    }
};

export const geocode = async (query) => {
    try {
        const response = await axios.get(`${GEOCODE_BASE_URL}/search`, {
            params: {
                q: query,
                format: 'json',
                limit: 1
            },
            headers: {
                // Nominatim strictly requires a valid User-Agent
                'User-Agent': 'DriveTrust-RouteEstimator/1.0'
            }
        });

        if (response.data && response.data.length > 0) {
            const lat = parseFloat(response.data[0].lat);
            const lng = parseFloat(response.data[0].lon);
            return [lat, lng];
        }
        return null;
    } catch (error) {
        console.error("Nominatim Geocoding error:", error);
        return null;
    }
};
