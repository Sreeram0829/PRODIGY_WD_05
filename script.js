// DOM Elements
        const cityInput = document.getElementById('city-input');
        const searchBtn = document.getElementById('search-btn');
        const locationBtn = document.getElementById('location-btn');
        const cityName = document.getElementById('city-name');
        const dateTime = document.getElementById('date-time');
        const weatherIcon = document.getElementById('weather-icon');
        const temperature = document.getElementById('temperature');
        const weatherDescription = document.getElementById('weather-description');
        const feelsLike = document.getElementById('feels-like');
        const humidity = document.getElementById('humidity');
        const windSpeed = document.getElementById('wind-speed');
        const pressure = document.getElementById('pressure');
        const hourlyContainer = document.getElementById('hourly-container');
        const dailyContainer = document.getElementById('daily-container');
        const errorMessage = document.getElementById('error-message');
        const unitButtons = document.querySelectorAll('.unit-btn');
        
        // API Configuration
        const API_KEY = '9ae43fe27711da497e8c1390d1471beb'; // Replace with your actual API key
        let currentUnit = 'metric';
        
        // Initialize the app
        function initApp() {
            updateDateTime();
            setInterval(updateDateTime, 60000); // Update time every minute
            
            // Event listeners
            searchBtn.addEventListener('click', () => {
                const city = cityInput.value.trim();
                if (city) {
                    getWeatherData(city, currentUnit);
                }
            });
            
            cityInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    const city = cityInput.value.trim();
                    if (city) {
                        getWeatherData(city, currentUnit);
                    }
                }
            });
            
            locationBtn.addEventListener('click', getLocationWeather);
            
            unitButtons.forEach(button => {
                button.addEventListener('click', () => {
                    unitButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    currentUnit = button.dataset.unit;
                    
                    // Get current city and fetch data with new unit
                    const currentCity = cityName.textContent.split(',')[0].trim();
                    if (currentCity) {
                        getWeatherData(currentCity, currentUnit);
                    }
                });
            });
            
            // Default to New York weather
            getWeatherData('New York', currentUnit);
        }
        
        // Update date and time
        function updateDateTime() {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            dateTime.textContent = now.toLocaleDateString('en-US', options);
        }
        
        // Get weather by geolocation
        function getLocationWeather() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const { latitude, longitude } = position.coords;
                        getWeatherByCoords(latitude, longitude, currentUnit);
                    },
                    error => {
                        console.error('Error getting location:', error);
                        showError('Unable to retrieve your location. Please enable location services.');
                    }
                );
            } else {
                showError('Geolocation is not supported by your browser.');
            }
        }
        
        // Get weather data by city name
        function getWeatherData(city, unit) {
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${API_KEY}`;
            
            fetch(apiUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('City not found');
                    }
                    return response.json();
                })
                .then(data => {
                    hideError();
                    displayCurrentWeather(data);
                    return fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${API_KEY}`);
                })
                .then(response => response.json())
                .then(forecastData => {
                    displayHourlyForecast(forecastData);
                    displayDailyForecast(forecastData);
                })
                .catch(error => {
                    console.error('Error fetching weather data:', error);
                    showError('City not found. Please try again.');
                });
        }
        
        // Get weather by coordinates
        function getWeatherByCoords(lat, lon, unit) {
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`;
            
            fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                    hideError();
                    displayCurrentWeather(data);
                    return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`);
                })
                .then(response => response.json())
                .then(forecastData => {
                    displayHourlyForecast(forecastData);
                    displayDailyForecast(forecastData);
                })
                .catch(error => {
                    console.error('Error fetching weather data:', error);
                    showError('Unable to retrieve weather data for your location.');
                });
        }
        
        // Display current weather
        function displayCurrentWeather(data) {
            cityName.textContent = `${data.name}, ${data.sys.country}`;
            
            const temp = Math.round(data.main.temp);
            const feels = Math.round(data.main.feels_like);
            const wind = data.wind.speed;
            
            temperature.textContent = `${temp}°${currentUnit === 'metric' ? 'C' : 'F'}`;
            feelsLike.textContent = `${feels}°${currentUnit === 'metric' ? 'C' : 'F'}`;
            humidity.textContent = `${data.main.humidity}%`;
            windSpeed.textContent = `${currentUnit === 'metric' ? wind.toFixed(1) + ' m/s' : (wind * 2.237).toFixed(1) + ' mph'}`;
            pressure.textContent = `${data.main.pressure} hPa`;
            
            weatherDescription.textContent = data.weather[0].description;
            weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
            weatherIcon.alt = data.weather[0].description;
        }
        
        // Display hourly forecast
        function displayHourlyForecast(data) {
            hourlyContainer.innerHTML = '';
            
            // Get the next 12 hours (3-hour intervals)
            const hourlyData = data.list.slice(0, 4);
            
            hourlyData.forEach(item => {
                const date = new Date(item.dt * 1000);
                const hour = date.getHours();
                const time = hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`;
                const temp = Math.round(item.main.temp);
                
                const hourlyItem = document.createElement('div');
                hourlyItem.className = 'hourly-item';
                hourlyItem.innerHTML = `
                    <div class="hourly-time">${time}</div>
                    <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}" class="hourly-icon">
                    <div class="hourly-temp">${temp}°${currentUnit === 'metric' ? 'C' : 'F'}</div>
                `;
                
                hourlyContainer.appendChild(hourlyItem);
            });
        }
        
        // Display daily forecast
        function displayDailyForecast(data) {
            dailyContainer.innerHTML = '';
            
            // Group by day
            const dailyData = {};
            data.list.forEach(item => {
                const date = new Date(item.dt * 1000);
                const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                
                if (!dailyData[day]) {
                    dailyData[day] = {
                        minTemp: item.main.temp_min,
                        maxTemp: item.main.temp_max,
                        weather: item.weather[0]
                    };
                } else {
                    if (item.main.temp_min < dailyData[day].minTemp) {
                        dailyData[day].minTemp = item.main.temp_min;
                    }
                    if (item.main.temp_max > dailyData[day].maxTemp) {
                        dailyData[day].maxTemp = item.main.temp_max;
                    }
                }
            });
            
            // Convert to array and remove duplicates
            const days = Object.keys(dailyData);
            const uniqueDays = [...new Set(days)].slice(0, 7);
            
            uniqueDays.forEach(day => {
                const dayData = dailyData[day];
                const minTemp = Math.round(dayData.minTemp);
                const maxTemp = Math.round(dayData.maxTemp);
                
                const dailyItem = document.createElement('div');
                dailyItem.className = 'daily-item';
                dailyItem.innerHTML = `
                    <div class="daily-day">${day}</div>
                    <div class="daily-weather">
                        <img src="https://openweathermap.org/img/wn/${dayData.weather.icon}.png" alt="${dayData.weather.description}" class="daily-icon">
                        <div class="daily-description">${dayData.weather.description}</div>
                    </div>
                    <div class="daily-temps">
                        <div class="daily-high">${maxTemp}°</div>
                        <div class="daily-low">${minTemp}°</div>
                    </div>
                `;
                
                dailyContainer.appendChild(dailyItem);
            });
        }
        
        // Show error message
        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
        
        // Hide error message
        function hideError() {
            errorMessage.style.display = 'none';
        }
        
        // Initialize the app when the DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);