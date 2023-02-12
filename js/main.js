const ctx = document.getElementById('graph');
const container = document.querySelector('.container');

const selectedContinent = localStorage.getItem('selectedContinent');
const selectedCountry = localStorage.getItem('selectedCountry');
const graphMode = localStorage.getItem('graphMode');

console.log('hi')
console.log(selectedContinent);
if(selectedContinent == null) {
    localStorage.setItem('selectedContinent', 'Europe');
    localStorage.setItem('graphMode', 'continent');
    window.location.reload();
}



let canvas;
//

let continentNames = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
let continentPopulations = [];
let countryNames = [];
let countryPopulations = [];
let cityNames = [];
let cityPopulations = [];
let countryPopulationHistory = {};


//button events
function addButtonsFromNames(names, container, callback) {
    let i;
    //console.log(names);
    for(i = 0; i < names.length; ++i) {
        let div = document.createElement('button');
        div.innerText = names[i];
        div.addEventListener('click', callback);
        container.appendChild(div);
    }
}


//load screen
const loadBar = document.querySelector('.lds-ring');
loadBar.classList.remove('lds-ring');
function loadScreen() {
    loadBar.classList.add('lds-ring');
    container.classList.add('hidden');
}
function unloadScreen() {
    loadBar.classList.remove('lds-ring');
    container.classList.remove('hidden');
}


// load stuff

async function fetchCountry() {
    try {
        const prom = await fetch('https://countriesnow.space/api/v0.1/countries/population');
        if(!prom.ok) throw new Error('HTTP error');
        const data = prom.json();
        return data;
    }
    catch(error) {
        console.log(error)
        return undefined;
    }
}
async function fetchCountriesInContinent(continent) {
    //TODO: read data from API
    try {
        let countries = await fetch(`https://restcountries.com/v3.1/region/${continent}`);
        if(!countries.ok) throw new Error('HTTP error');
        countries = countries.json();
        return countries;
    }
    catch(error) {
        console.log(error);
        return undefined;
    }
}
async function fetchCity() {
    try {
        const prom = await fetch('https://countriesnow.space/api/v0.1/countries/population/cities');
        if(!prom.ok) throw new Error('HTTP error');
        const data = prom.json();
        return data;
    }
    catch(error) {
        console.log(error)
        return undefined;
    }
}
function getCountryCities() {
    let cities = [];
    const prom = fetchCity();
    prom.then(function(data) {
        for(let i of data.data) {
            let city = {};
            city['name'] = i.city;
            city['populationCounts'] = i.populationCounts; // deep copy

            if(cities[i.country] === undefined){
                cities[i.country] = [];
            }
            cities[i.country].push(city);
        }
    });

    return cities;
}




//chart stuff
function loadChart(names, population) {
    canvas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: names,
            datasets: [{
                label: 'population',
                data: population,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
            y: {
                beginAtZero: true
            }
        }
        }
    });
}


//execute load


fetchCountriesInContinent(selectedContinent)
.then(
    function(data) {
        let i;
        for(i of data) {
            countryNames.push(i.name.common);
            countryPopulations.push(i.population);
        }

        fetchCountry().then(
            function(data) {
                let i;
                for(i of data.data) {
                    countryPopulationHistory[i.country] = i.populationCounts;
                }

                let cities = []
                const prom = fetchCity();
                prom.then( function(data) {
                    for(let i of data.data) {
                        let city = {}
                        city['name'] = i.city;
                        city['populationCounts'] = i.populationCounts; // deep copy
                        if(cities[i.country] === undefined){
                            cities[i.country] = [];
                        }
                        cities[i.country].push(city);
                    }

                    console.log('mode', graphMode)
                    if(graphMode == null) {
                        localStorage.setItem('graphMode', 'continent');
                        localStorage.setItem('selectedContinent', 'Europe');
                        graphMode = 'continent';
                    }
    
                    addButtonsFromNames(continentNames, document.querySelector('#continents'), 
                            function(event) {
                                localStorage.setItem('selectedContinent', event.target.innerText);
                                localStorage.setItem('graphMode', 'continent');
                                window.location.reload();   
                            });

                    if(graphMode == 'continent') {
                        loadChart(countryNames, countryPopulations);

                        //continent buttons
                        addButtonsFromNames(countryNames, document.querySelector('#countries'), 
                            function(event) {
                                localStorage.setItem('selectedCountry', event.target.innerText);
                                localStorage.setItem('graphMode', 'country');
                                window.location.reload();
                            })
                    }
                    else if(graphMode == 'country') {
                        let k;
                        let citiesInCountry = []
                        
                        if(cities[selectedCountry] == undefined) {
                            document.querySelector('p').classList.remove('hidden');
                            return;
                        }

                        for(k of cities[selectedCountry]) {
                            citiesInCountry.push(k.name);
                        }
                        let citiesPopulation = [];
                        for(k of cities[selectedCountry]) {
                            let value = k.populationCounts.slice(-1)[0].value
                            value = Number.parseInt(value)
                            //value = Number.parseInt(value)
                            citiesPopulation.push(value);
                        }

                        loadChart(citiesInCountry, citiesPopulation);

                    }

                })



            }).catch( function(err) {
                console.error(err);        
            }
        )

    }
).catch(function(err) {
    console.error(err);   
})
