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

document.addEventListener('DOMContentLoaded', () => {
    navigator.geolocation.getCurrentPosition(async position => {
        const { latitude, longitude } = position.coords;
        map = L.map('map').setView([latitude, longitude], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        marker = L.marker([latitude, longitude]).addTo(map);

        await selectLocation(latitude, longitude);

        map.on('click', async (ev) => {
            marker.setLatLng(ev.latlng);
            await selectLocation(ev.latlng.lat, ev.latlng.lng);
        });
    });
});

const request = async (url) => {
    const response = await fetch(url);
    return response.ok ? response.json() : Promise.reject({ error: 500 });
};

async function selectLocation(lat, lon) {
    const weatherData = await request(`/api/getPositionWeather/${lat}/${lon}`);

    document.getElementById("location").innerText = "Location: " + weatherData.name;
    document.getElementById("temp").innerText = "Temperature: " + weatherData.main.temp + " °C";
    document.getElementById("feels-like").innerText = "Feels like: " + weatherData.main.feels_like  + " °C";
    document.getElementById("max-temp").innerText = "Maximum temperature: " + weatherData.main.temp_max + " °C";
    document.getElementById("min-temp").innerText = "Minimum temperature: " + weatherData.main.temp_min + " °C";
    document.getElementById("humidity").innerText = "Humidity: " + weatherData.main.humidity + "%";
    document.getElementById("cloudiness").innerText = "Cloudiness: " + weatherData.clouds.all + "%";

    // add weather image to information div
    document.getElementById("icon")?.remove();
    const weatherImage = document.createElement("img");
    weatherImage.setAttribute("src", `http://openweathermap.org/img/w/${weatherData.weather[0].icon}.png`);
    weatherImage.setAttribute("id", "icon");
    weatherImage.setAttribute("alt", "");
    document.getElementById("location").after(weatherImage);

    const addButton = document.getElementById("add-to-dashboard-button");
    const infoPar = document.getElementById("info");
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

        const resp = await requestPost("/api/addToFavorites", {name: weatherData.name});
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

        const resp = await requestPost("/api/removeFromFavorites", {name: weatherData.name});
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
        const isCityFavorited = await requestGet("/api/isInFavorites?" + new URLSearchParams({name: weatherData.name}));

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
        
        window.open("/api/detailedInfo?"  + new URLSearchParams({lat: lat, lon: lon}));
    }

    detailedInfoButton.onclick = downloadDetailedInfo;
}