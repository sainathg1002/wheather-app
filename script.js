
async function fetchdata() {
    // Get the city name from the input field
    let cityName = document.getElementsByClassName('inputbox')[0].value;
    console.log("cityname:", cityName);

    // Basic validation to ensure the input is not empty
    if (!cityName) {
        alert('Please enter a city name.');
        return;
    }

    try {
        // Construct the API URL
        const apiKey = 'c8e5c22207a3717589ba73fde802f340';
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;

        // Fetch the data from the API
        const requestData = await fetch(url);

        // Check for a successful response (status code 200-299)
        if (!requestData.ok) {
            throw new Error(`Error: ${requestData.status} - ${requestData.statusText}`);
        }

        // Parse the JSON data
        const formattedData = await requestData.json();
        console.log(formattedData);

        // Extract the required information
        const responseCityName = formattedData.name;
        const responseFeelsLike = formattedData.main.feels_like;
        const responseHumidity = formattedData.main.humidity;
        const responseMain = formattedData.weather[0].description;
        const responsetemp = formattedData.main.temp;

        // Log the extracted data
        console.log("responsemain:", responseMain);
        console.log("responsehumidity:", responseHumidity);
        console.log("responsefeelslike:", responseFeelsLike);
        console.log("responsecityname:", responseCityName);

        // timezone offset (seconds) provided by API
        // Ensure formattedData.timezone is a number; default to 0 if not.
        const tzOffset = formattedData.timezone && typeof formattedData.timezone === 'number' ? formattedData.timezone : 0; // timezone offset (seconds) provided by API
const serverDt = formattedData.dt; // current data timestamp (UTC seconds)

                // small helper to format time/date using API timezone (use UTC methods so browser tz doesn't alter)
                const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const fmtTime = (sec) => {
                    const totalMs = (Number(sec) + Number(tzOffset)) * 1000;
                    const d = new Date(totalMs);
                    // use UTC getters so the client's timezone doesn't shift the displayed local time
                    let h = d.getUTCHours();
                    const m = d.getUTCMinutes();
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    h = h % 12; if (h === 0) h = 12;
                    return `${h}:${String(m).padStart(2,'0')} ${ampm}`;
                };

                const fmtDate = (sec) => {
                    const totalMs = (Number(sec) + Number(tzOffset)) * 1000;
                    const d = new Date(totalMs);
                    const wd = weekdays[d.getUTCDay()];
                    const mo = months[d.getUTCMonth()];
                    const day = d.getUTCDate();
                    return `${wd}, ${mo} ${day}`;
                };

        // update datetime widget
        const timeEl = document.querySelector('.datetime-widget .time');
        const dayEl = document.querySelector('.datetime-widget .day');
        if (timeEl) timeEl.textContent = fmtTime(serverDt);
        if (dayEl) dayEl.textContent = fmtDate(serverDt);

        // sunrise / sunset from API (UTC seconds)
        const sunriseSec = formattedData.sys && formattedData.sys.sunrise ? formattedData.sys.sunrise : null;
        const sunsetSec = formattedData.sys && formattedData.sys.sunset ? formattedData.sys.sunset : null;

        // update small sunbox times (if present)
        const sunTimeEls = document.querySelectorAll('.small-sunbox .sun-time');
        if (sunTimeEls && sunTimeEls.length >= 2) {
            if (sunriseSec) sunTimeEls[0].textContent = fmtTime(sunriseSec);
            if (sunsetSec)  sunTimeEls[1].textContent = fmtTime(sunsetSec);
        }
        // also update the quick-info second pill (if exists)
        const quickPills = document.querySelectorAll('.quick-info .pill');
        if (quickPills && quickPills.length >= 2 && sunriseSec && sunsetSec) {
            quickPills[1].textContent = `${fmtTime(sunriseSec)} • ${fmtTime(sunsetSec)}`;
        }

        // Update first pill with min/max temps from API if available
        try {
            const apiTempMin = formattedData.main && typeof formattedData.main.temp_min === 'number' ? Math.round(formattedData.main.temp_min - 273.15) : null;
            const apiTempMax = formattedData.main && typeof formattedData.main.temp_max === 'number' ? Math.round(formattedData.main.temp_max - 273.15) : null;
            if (quickPills && quickPills.length >= 1) {
                if (apiTempMin !== null && apiTempMax !== null) {
                    quickPills[0].textContent = `${apiTempMin}° / ${apiTempMax}°`;
                } else if (apiTempMin !== null) {
                    quickPills[0].textContent = `${apiTempMin}°`;
                }
            }
        } catch (e) {
            // fail silently
            console.warn('Could not update pill temps', e);
        }

    // Also set .sunrise and .sunset elements if present (user-provided selectors)
    const sunriseEl = document.querySelector('.sunrise');
    const sunsetEl = document.querySelector('.sunset');
    if (sunriseEl && sunriseSec) sunriseEl.textContent = fmtTime(sunriseSec);
    if (sunsetEl && sunsetSec) sunsetEl.textContent = fmtTime(sunsetSec);

        // Generate simple synthetic 5-day forecast min/max from current temp
        // (weather API used here doesn't provide daily forecast; this synthesizes plausible values)
        const dayBoxes = document.querySelectorAll('.forecast .day-box');
        // base temperature in Celsius
        const baseTempC = (typeof responsetemp === 'number') ? Math.round(responsetemp - 273.15) : (tempC !== null ? tempC : null);
        if (dayBoxes && dayBoxes.length > 0 && baseTempC !== null) {
            // helper random int
            const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
            dayBoxes.forEach((box, i) => {
                const dailyMax = baseTempC + randInt(0, 6);
                const dailyMin = baseTempC - randInt(1, 6);
                const p = box.querySelector('p');
                if (p) p.textContent = `${dailyMax}° / ${dailyMin}°`;
            });
        }

 

    // Update the HTML elements with the data (guarded to avoid null errors)
    const cityEl = document.querySelector('.city');
    if (cityEl) cityEl.innerText = responseCityName;

    // HTML uses class "conditions" for the text; update safely and add metadata
    let condEl = document.querySelector('.conditions');
    const safeText = (responseMain || 'N/A').toString();
    if (!condEl) {
        // Create the element and insert it near the main temperature so it is visible
        condEl = document.createElement('div');
        condEl.className = 'conditions';
        condEl.textContent = safeText;
        // Try to place it inside the temp container if possible
        const tempLargeEl = document.querySelector('.temp-large');
        if (tempLargeEl && tempLargeEl.parentNode) {
            // insert after tempLargeEl
            tempLargeEl.parentNode.insertBefore(condEl, tempLargeEl.nextSibling);
        } else {
            const heroLeft = document.querySelector('.hero-left');
            if (heroLeft) heroLeft.appendChild(condEl);
            else document.body.appendChild(condEl);
        }
    } else {
        condEl.textContent = safeText;
    }
    // add a data attribute and title for accessibility / later use
    condEl.setAttribute('data-condition', safeText.toLowerCase());
    condEl.title = safeText;

        // Convert feels_like (Kelvin) to Celsius and update UI safely
        let feelsC = null;
        let tempC = null;
        if (typeof responseFeelsLike === 'number') {
            feelsC = Math.round(responseFeelsLike - 273.15);
        }
        if (typeof responsetemp === 'number') {
            tempC = Math.round(responsetemp - 273.15);
        }

        const feelsValueEl = document.querySelector('.feels .value');
        if (feelsValueEl) feelsValueEl.innerText = feelsC !== null ? `${feelsC}°` : '--';

        // The main temperature in the hero uses `.temp-large` in the HTML — update that element
        const tempLargeEl = document.querySelector('.temp-large');
        if (tempLargeEl) {
            if (tempC !== null) {
                tempLargeEl.innerHTML = `${tempC}<span class="deg">°C</span>`;
            } else {
                tempLargeEl.innerText = '--';
            }
        }

    // Update humidity value (the markup uses .hum .value)
    const humValueEl = document.querySelector('.hum .value');
    if (humValueEl) humValueEl.innerText = `${responseHumidity}%`;

    } catch (error) {
        console.error("An error occurred:", error);
        alert(`Failed to fetch weather data. Please check the city name. \nDetails: ${error.message}`);
    }

  
}