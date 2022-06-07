const requestGet = async (url) => {
    const response = await fetch(url);
    return response.ok ? response.json() : Promise.reject({ error: 500 });
};

const requestPost = async (url, data) => {
    const response = await fetch(
        url,
        {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }
    );

    return response.ok ? response.json() : Promise.reject({ error: 500});
}

function addToDashboard() {

}

document.addEventListener('DOMContentLoaded', async() => {
    // loading map and data 
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get("name");
    var weatherDataInCity;
    
    try {
        weatherDataInCity = await requestGet(`/api/getCityWeather/${city}`);
    } catch (err) {
        document.getElementById("map-row").style.display = "none";
        document.getElementById("error-div").classList.add("h-100");
        document.getElementById("error").innerText = weatherDataInCity['error'];
        return;
    }

    if ('error' in weatherDataInCity) {
        document.getElementById("map-row").style.display = "none";
        document.getElementById("error-div").classList.add("h-100");
        document.getElementById("error").innerText = weatherDataInCity['error'];
        return;
    }

    const latitude = weatherDataInCity.coord.lat;
    const longitude = weatherDataInCity.coord.lon;
    map = L.map('map').setView([latitude, longitude], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    marker = L.marker([latitude, longitude]).addTo(map);

    document.getElementById("current-city").innerText = weatherDataInCity.name;
    document.getElementById("location").innerText = "Location: " + weatherDataInCity.name;
    document.getElementById("temp").innerText = "Temperature: " + weatherDataInCity.main.temp + " °C";
    document.getElementById("feels-like").innerText = "Feels like: " + weatherDataInCity.main.feels_like  + " °C";
    document.getElementById("max-temp").innerText = "Maximum temperature: " + weatherDataInCity.main.temp_max + " °C";
    document.getElementById("min-temp").innerText = "Minimum temperature: " + weatherDataInCity.main.temp_min + " °C";
    document.getElementById("humidity").innerText = "Humidity: " + weatherDataInCity.main.humidity + "%";
    document.getElementById("cloudiness").innerText = "Cloudiness: " + weatherDataInCity.clouds.all + "%";

    // add weather image to information div
    const weatherImage = document.createElement("img");
    weatherImage.setAttribute("src", `http://openweathermap.org/img/w/${weatherDataInCity.weather[0].icon}.png`);
    weatherImage.setAttribute("id", "icon");
    weatherImage.setAttribute("alt", "");
    document.getElementById("location").after(weatherImage);

    const infoPar = document.getElementById("info");
    const addButton = document.getElementById("add-to-dashboard-button");

    // check if the selected city is already favorited
    //  in order to correctly choose the add button behaviour
    const isLoggedIn = await requestGet("/api/loggedIn");

    if ('error' in isLoggedIn) {
        infoPar.innerText = isLoggedIn.message;
        return;
    }

    const addFunction = async () => {
        if (!isLoggedIn.loggedIn)
            window.location.href = "/login";

        const resp = await requestPost("/api/addToFavorites", {name: weatherDataInCity.name});
        if ('error' in resp && resp['error']) {
            infoPar.classList.replace("text-success", "text-danger");
            infoPar.innerText = resp.message;
        }
        
        if ('success' in resp && resp['success']) {
            infoPar.classList.replace("text-danger", "text-success");
            infoPar.innerText = resp.message;

            // switch button behaviour
            addButton.innerText = "Remove From Dashboard";
            addButton.onclick = removeFunction;
        }
    }

    const removeFunction = async () => {
        if (!isLoggedIn.loggedIn)
            window.location.href = "/login";

        const resp = await requestPost("/api/removeFromFavorites", {name: weatherDataInCity.name});
        if ('error' in resp && resp['error']) {
            infoPar.classList.replace("text-success", "text-danger");
            infoPar.innerText = resp.message;
        }
        
        if ('success' in resp && resp['success']) {
            infoPar.classList.replace("text-danger", "text-success");
            infoPar.innerText = resp.message;

            // switch button behaviour
            addButton.innerText = "Add To Dashboard";
            addButton.onclick = addFunction;
        }
    };

    addButton.innerText = "Add To Dashboard";
    addButton.onclick = addFunction;

    if (isLoggedIn.loggedIn) {
        const isCityFavorited = await requestGet("/api/isInFavorites?" + new URLSearchParams({name: weatherDataInCity.name}));

        if ('error' in isCityFavorited) {
            infoPar.innerText = isCityFavorited.message;
            return;
        }

        if (isCityFavorited.exists) {
            addButton.innerText = "Remove From Dashboard";
            addButton.onclick = removeFunction;
        }
    }

    const detailedInfoButton = document.getElementById("detailed-info-button");

    const downloadDetailedInfo = async () => {
        if (!isLoggedIn.loggedIn)
            window.location.href = "/login";
        
        window.open("/api/detailedInfo?"  + new URLSearchParams({lat: latitude, lon: longitude}));
    }

    detailedInfoButton.onclick = downloadDetailedInfo;
});