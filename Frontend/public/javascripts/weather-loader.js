const requestGet = async (url) => {
    const response = await fetch(url);
    return response.ok ? response.json() : Promise.reject({ error: 500 });
};

const getCityWeatherInfo = async (city) => {
    try {
        const weatherResponse = await requestGet(`/api/getCityWeather/${city}`);
        document.getElementById(`temp-${city}-car`).innerText = weatherResponse.main.temp + "°C";
    } catch (err) {
        console.log(err);
    }
}

const getWeatherInfo = async (latitude, longitude) => {
    try {
        const response = await requestGet(`/api/getPositionWeather/${latitude}/${longitude}`);
        document.getElementById("temp-current-location").innerText = response.main.temp + "°C";
        document.getElementById("name-current-location").innerText = response.name;
    } catch (err) {
        console.log(err);
    }
};


document.addEventListener('DOMContentLoaded', () => {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            getWeatherInfo(latitude, longitude);
        }
    );

    getCityWeatherInfo("Milan");
    getCityWeatherInfo("Sidney");
    getCityWeatherInfo("London");
});