// API Configuration
const API_KEY = '1e76144d9953565999207d14017e61c4';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const themeToggle = document.getElementById('theme-toggle');
const cityName = document.getElementById('city-name');
const date = document.getElementById('date');
const temp = document.getElementById('temp');
const weatherDesc = document.getElementById('weather-desc');
const wind = document.getElementById('wind');
const humidity = document.getElementById('humidity');
const pressure = document.getElementById('pressure');
const airQuality = document.getElementById('air-quality');
const forecastList = document.getElementById('forecast-list');

// Map Configuration
let map;
let marker;

// Set default city
const DEFAULT_CITY = 'Madhubani';

// Theme Management
let darkMode = localStorage.getItem('darkMode') === 'true';

// Air Quality Index descriptions
const AQI_LEVELS = {
    1: 'Good',
    2: 'Fair',
    3: 'Moderate',
    4: 'Poor',
    5: 'Very Poor'
};

function updateTheme() {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    themeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    
    // Update map styles if map exists
    if (map) {
        map.setOptions({
            styles: darkMode ? [
                {
                    featureType: "all",
                    elementType: "geometry",
                    stylers: [{ color: "#242f3e" }]
                },
                {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [{ color: "#17263c" }]
                },
                {
                    featureType: "all",
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#746855" }]
                }
            ] : [
                {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [{ color: "#e9e9e9" }]
                },
                {
                    featureType: "landscape",
                    elementType: "geometry",
                    stylers: [{ color: "#f5f5f5" }]
                },
                {
                    featureType: "road",
                    elementType: "geometry",
                    stylers: [{ color: "#ffffff" }]
                },
                {
                    featureType: "poi",
                    elementType: "geometry",
                    stylers: [{ color: "#f5f5f5" }]
                },
                {
                    featureType: "transit",
                    elementType: "geometry",
                    stylers: [{ color: "#f2f2f2" }]
                }
            ]
        });
    }
}

// Theme toggle event listener
themeToggle.addEventListener('click', () => {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    updateTheme();
});

function initMap(lat = 28.6139, lng = 77.2090) { // Default to New Delhi
    try {
        const mapOptions = {
            center: { lat, lng },
            zoom: 10,
            styles: [
                {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [{ color: "#e9e9e9" }]
                },
                {
                    featureType: "landscape",
                    elementType: "geometry",
                    stylers: [{ color: "#f5f5f5" }]
                },
                {
                    featureType: "road",
                    elementType: "geometry",
                    stylers: [{ color: "#ffffff" }]
                },
                {
                    featureType: "poi",
                    elementType: "geometry",
                    stylers: [{ color: "#f5f5f5" }]
                },
                {
                    featureType: "transit",
                    elementType: "geometry",
                    stylers: [{ color: "#f2f2f2" }]
                }
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
        };

        map = new google.maps.Map(document.getElementById('map'), mapOptions);
        marker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            animation: google.maps.Animation.DROP
        });

    } catch (error) {
        console.error('Error initializing map:', error);
        document.getElementById('map').innerHTML = `
            <div style="height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px;">
                <p>Unable to load map. Please check your Google Maps API key.</p>
            </div>
        `;
    }
}

// Update map location
function updateMap(lat, lng, cityName) {
    try {
        if (map && marker) {
            const position = { lat, lng };
            map.setCenter(position);
            marker.setPosition(position);
            marker.setTitle(cityName);
        }
    } catch (error) {
        console.error('Error updating map:', error);
    }
}

// Date Formatting
function formatDate(timestamp) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(timestamp * 1000).toLocaleDateString('en-US', options);
}

// Weather Data Fetching
async function fetchWeatherData(city) {
    try {
        if (!API_KEY) {
            alert('Please add your OpenWeatherMap API key in script.js');
            return null;
        }
        
        const weatherResponse = await fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`);
        if (!weatherResponse.ok) {
            if (weatherResponse.status === 401) {
                alert('Invalid API key. Please check your OpenWeatherMap API key.');
            } else if (weatherResponse.status === 404) {
                alert('City not found. Please check the city name.');
            } else {
                alert('Error fetching weather data. Please try again.');
            }
            throw new Error(`HTTP error! status: ${weatherResponse.status}`);
        }
        const weatherData = await weatherResponse.json();
        
        // Fetch air quality data
        const airQualityResponse = await fetch(
            `${BASE_URL}/air_pollution?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&appid=${API_KEY}`
        );
        if (airQualityResponse.ok) {
            const airQualityData = await airQualityResponse.json();
            weatherData.airQuality = airQualityData.list[0].main.aqi;
        }
        
        // Update map with new coordinates
        updateMap(weatherData.coord.lat, weatherData.coord.lon, weatherData.name);
        
        return weatherData;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function fetchForecastData(city) {
    try {
        if (!API_KEY) {
            return null;
        }
        
        const response = await fetch(`${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Forecast data not available');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Update UI
function updateWeatherUI(data) {
    cityName.textContent = data.name;
    date.textContent = formatDate(data.dt);
    temp.textContent = `${Math.round(data.main.temp)}°C`;
    weatherDesc.textContent = data.weather[0].description;
    wind.textContent = `${data.wind.speed} km/h`;
    humidity.textContent = `${data.main.humidity}%`;
    pressure.textContent = `${data.main.pressure} hPa`;
    
    // Update air quality if available
    if (data.airQuality) {
        airQuality.textContent = AQI_LEVELS[data.airQuality];
        airQuality.className = `aqi-level-${data.airQuality}`;
    } else {
        airQuality.textContent = 'N/A';
        airQuality.className = '';
    }
}

function updateForecastUI(forecastData) {
    forecastList.innerHTML = '';
    const dailyForecasts = forecastData.list.filter((_, index) => index % 8 === 0).slice(0, 5);
    
    dailyForecasts.forEach(forecast => {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <p>${new Date(forecast.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</p>
            <p>${Math.round(forecast.main.temp)}°C</p>
            <p>${forecast.weather[0].description}</p>
        `;
        forecastList.appendChild(forecastItem);
    });
}

// Event Listeners
searchBtn.addEventListener('click', async () => {
    const city = searchInput.value.trim();
    if (!city) return;
    
    const weatherData = await fetchWeatherData(city);
    if (weatherData) {
        updateWeatherUI(weatherData);
        
        const forecastData = await fetchForecastData(city);
        if (forecastData) {
            updateForecastUI(forecastData);
        }
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// Initialize app
async function initializeApp() {
    // Set initial theme
    updateTheme();
    
    const weatherData = await fetchWeatherData(DEFAULT_CITY);
    if (weatherData) {
        updateWeatherUI(weatherData);
        
        const forecastData = await fetchForecastData(DEFAULT_CITY);
        if (forecastData) {
            updateForecastUI(forecastData);
        }
    }
    
    searchInput.value = DEFAULT_CITY;
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initMap();
});

// Heading interaction logging
document.querySelector('.brand-container').addEventListener('mouseenter', () => {
    console.log('StormEye heading hovered - Animation started');
});

document.querySelector('.brand-container').addEventListener('mouseleave', () => {
    console.log('StormEye heading hover ended - Animation reversed');
}); 