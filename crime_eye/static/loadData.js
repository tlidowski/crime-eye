let table_parent = document.getElementById("table_parent");
let graphHeight = 500;
let mapChart;
let compareBtn = document.getElementById("compare");
let crimeRateSingle = document.getElementById('crimeRateSingle');
let crimeRateMultiple = document.getElementById('crimeRateMultiple');
let crimeRateSide = "single";
let graphSide = "single";
const DEFAULT_COMPARE_DROPDOWN_MESSAGE = "Nothing selected";
const pull = document.getElementById("pull");
const addressButton = document.getElementById("addressSearchButton");
const cityInput = document.getElementById("city");
const startInput = document.getElementById("start");
const endInput = document.getElementById("end");
const cityCompareInput = document.getElementsByClassName(
    "filter-option-inner-inner"
);

// Reset map's data when city is selected
// (Prevents specific address lookup button from triggering after city change) 
document.getElementById("city").addEventListener('change', function () {
    mapChart.resetCity();
})

function isValidInputs(city, start, end) {
    if (isNaN(start) || city === 'Select City') {
        insert_error("City Selection or Start Year Missing");
        return false;
    }
    if (start < 2020 || start > 2021) {
        insert_error("Start Year Must Be Between 2020-2021");
        return false;
    }
    if (!isNaN(end) && (end < 2020 || end > 2021 || start > end)) {
        insert_error("End Year Must Be Between 2020-2021");
        return false;
    }
    return true
}

function getOtherCities(city) {
    let cities = cityCompareInput[0].innerHTML;
    if (cities === DEFAULT_COMPARE_DROPDOWN_MESSAGE) {
        return null
    }
    if (cities) {
        cities = cities.replaceAll(", " + city, "")
        cities = cities.replaceAll(city + ", ", "")
        cities = cities.replaceAll(", " + city, "")
        cities = cities.replaceAll(city, "")
    }
    if (cities.length === 0) {
        cities = null;
    }
    return cities
}

function generateGraphs() {
    let city = cityInput.value;
    let start = parseInt(startInput.value);
    let end = parseInt(endInput.value);

    // Returns null instead of the dropdown's default message (for comparison purposes w/ null)
    let otherCities = getOtherCities(city);

    // Validation
    if (!isValidInputs(city, start, end)) {
        return
    }
    if(!end){
        end=start;
    }
    generateCrimeTables(city, start, end, otherCities);
    generateMap(city, start, end, otherCities);
    if (!otherCities) {
        generatePieChart(city, start, end, otherCities);
        generateBarGraph(city, start, end, otherCities);
        if (graphSide === 'multiple') {
            $('#multiDataGraphs').collapse('toggle');
            $('#singleDataGraphs').collapse('toggle');
            $('#bubbleCollapse').collapse('toggle');
            $('#pieCollapse').collapse('toggle');
            graphSide = 'single';
        }
    } else {
        generateStackedBarGraph(city, start, end, otherCities);
        generateBubbleGraph(city, otherCities);
        if (graphSide === 'single') {
            $('#singleDataGraphs').collapse('toggle');
            $('#multiDataGraphs').collapse('toggle');
            $('#pieCollapse').collapse('toggle');
            $('#bubbleCollapse').collapse('toggle');
            graphSide = 'multiple';
        }
    }
    generateLineGraph(city, start, end, otherCities);
    mapChart.map.resize();
}

pull.addEventListener("click", generateGraphs);
addressButton.addEventListener("click", searchSpecificLocation)

function generateMap(city, start, end, otherCities) {
    let dropdownCity = city;
    let radius = mapChart.getRadius();
    const apiKey = "319cf01c353142f082ee1055a6689222";
    var url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(city)}&format=json&limit=5&apiKey=${apiKey}`;
    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            let output = data.results[0]
            mapChart.setAddressData(output);
        }).then(_ => {
        // Now do the actual map updating
        let lat = mapChart.centerLat;
        let lon = mapChart.centerLon;
        fetch(
            `http://127.0.0.1:5000/crimes_from_address?dropdownCity=${dropdownCity}&cityName=${city}&start=${start}&end=${end}&radius=${radius}&lat=${lat}&lon=${lon}`
        )
            .then((response) => {
                return response.json();
            })
            .then((res) => {
                if (res.errors.length) {
                    insert_error(`Error: ${res.errors[0]}`);
                } else {
                    mapChart.sendData(res.features, res.center);
                    let crimeScoreBox = document.getElementById("safety-score-box");
                    crimeScoreBox.innerHTML = res.crimeScore;
                    let crimeScoreBoxLabel = document.getElementById("safety-score-label");
                    crimeScoreBoxLabel.innerHTML = res.crimeScoreLabel;

                    let crimeRateBox = document.getElementById("crime-rate-box");
                    crimeRateBox.innerHTML = res.crimeRate;
                    let crimeRateBoxLabel = document.getElementById("crime-rate-label");
                    crimeRateBoxLabel.innerHTML = res.crimeRateLabel;
                    // Resets map data
                    mapChart.resetCity()
                }

            });
    })


}


function searchSpecificLocation() {
    inputBox = document.getElementById("addressInputBox")
    let dropdownCity = cityInput.value;
    let start = parseInt(startInput.value);
    let end = parseInt(endInput.value);
    let radius = mapChart.getRadius();

    // Returns null instead of the dropdown's default message (for comparison purposes w/ null)
    let otherCities = getOtherCities();

    // Validation
    if (!isValidInputs(dropdownCity, start, end)) {
        return
    }
    let city = mapChart.cityName;
    if (city == null || !inputBox.value || (inputBox.value == inputBox.placeholder)) {
        insert_error(`Please type a valid address for ${dropdownCity} before searching`)
        return
    }
    let lat = mapChart.centerLat;
    let lon = mapChart.centerLon;
    fetch(
        `http://127.0.0.1:5000/crimes_from_address?dropdownCity=${dropdownCity}&cityName=${city}&start=${start}&end=${end}&radius=${radius}&lat=${lat}&lon=${lon}`
    )
        .then((response) => {
            return response.json();
        })
        .then((res) => {
            if (res.errors.length) {
                insert_error(`Error: ${res.errors[0]}`);
            } else {
                mapChart.sendData(res.features, res.center);
                let crimeScoreBox = document.getElementById("safety-score-box");
                crimeScoreBox.innerHTML = res.crimeScore;
                let crimeScoreBoxLabel = document.getElementById("safety-score-label");
                crimeScoreBoxLabel.innerHTML = res.crimeScoreLabel;

                // Resets map data
                mapChart.resetCity()
            }
        });

}

function generatePieChart(city, start, end, otherCities) {
    if (otherCities != null) {
        return;
    } else {
        fetch(
            `http://127.0.0.1:5000/crimes_pie_chart?city=${city}&start=${start}&end=${end}`
        )
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                $(document).ready(function () {
                    var pieChart_data = [
                        {
                            type: "pie",
                            title: "Crime Pie Chart",
                            values: data.property_counts,
                            labels: data.property_crimes,
                        },
                    ];
                    var layout = {
                        height: 310,
                    };
                    Plotly.newPlot("pieChart", pieChart_data, layout);
                });
            });
    }
}

function generateLineGraph(city, start, end, otherCities) {
    fetch(
        `http://127.0.0.1:5000/crimes_line_graph?city=${city}&start=${start}&end=${end}&otherCities=${otherCities}`
    )
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            $(document).ready(function () {
                var traces = [];
                for (const city in data) {
                    if (data[city]) {
                        var dates = data[city].dates.map(dateString => {
                            var parts = dateString.split('/');
                            var month = parseInt(parts[0], 10);
                            var year = parseInt(parts[1], 10);
                            return new Date(year, month - 1);
                        });

                        var sortedData = data[city].counts.map((count, index) => ({
                            date: dates[index],
                            count: count
                        })).sort((a, b) => a.date - b.date);

                        traces.push({
                            type: "scatter",
                            x: sortedData.map(data => data.date),
                            y: sortedData.map(data => data.count),
                            name: city,
                        });
                    }
                }

                var selectorOptions = {
                    buttons: [{
                        step: 'month',
                        stepmode: 'backward',
                        count: 1,
                        label: '1M'
                    }, {
                        step: 'month',
                        stepmode: 'forward',
                        count: 6,
                        label: '6M'
                    },{
                        step: 'year',
                        stepmode: 'forward',
                        count: 1,
                        label: '1Y'
                    }, {
                        step: 'all',
                        label: 'All'
                    }],
                };
                var layout = {
                    height: graphHeight,
                    title: "Crime History",
                    xaxis: {
                        title: "Month/Year",
                        tickangle: -45,
                        rangeselector: selectorOptions,
                        rangeslider: {}
                    },
                    yaxis: {
                        title: "Criminal Activity",
                        rangemode: "tozero",
                    },
                };

                Plotly.newPlot("lineGraph", traces, layout);
            });
        });
}


const crimeTypes = ["Property", "Person", "Society", "Other"];

const barModes = {
    Group: "group",
    Stack: "stack",
};

function getBarModeLayout(barmode, title, xAxisTitle, yAxisTitle) {
    let layout = {
        barmode: barmode,
        title: title,
        xaxis: {title: xAxisTitle},
        yaxis: {title: yAxisTitle},
        height: graphHeight,
    };
    return layout;
}

function generateBarGraph(city, start, end, otherCities) {
    let city2 = otherCities;
    fetch(
        `http://127.0.0.1:5000/crimes_bar_graph?city=${city}&city2=${city2}&start=${start}&end=${end}`
    )
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            $(document).ready(function () {
                var cityOne = {
                    type: "bar",
                    name: city,
                    y: data.counts,
                    x: data.crimes,
                };
                var cityTwo = {
                    type: "bar",
                    name: city2,
                    y: data.counts2,
                    x: data.crimes2,
                };
                var bar_data = [cityOne, cityTwo];
                var layout = {
                    height: graphHeight,
                    barmode: "group",
                    title: "Comparison of Crimes Committed",
                    xaxis: {title: "Categories by City"},
                    yaxis: {title: "Number of Crimes"},
                };
                Plotly.newPlot("barGraph", bar_data, layout);
            });
        });
}

function getStackedBarTraces(xVals, yVals, name) {
    let trace = {
        x: xVals,
        y: yVals,
        name: name,
        type: "bar",
    };
    return trace;
}

function isString(s) {
    return isinstance(s, str);
}

function buildOtherCitiesList(otherCities) {
    let otherCitiesList = [];
    if (otherCities != null) {
        otherCities = otherCities.split(",");
        let i = 0;
        while (i < otherCities.length) {
            otherCities[i] = otherCities[i].trim();
            i += 1;
        }
        otherCitiesList.push(...otherCities);
    }
    return otherCitiesList;
}

function generateStackedBarGraph(city, start, end, otherCities) {
    let otherCitiesList = buildOtherCitiesList(otherCities);
    fetch(
        `http://127.0.0.1:5000/crimes_stacked_bar_graph?city=${city}&start=${start}&end=${end}&otherCities=${JSON.stringify(
            {other_cities: otherCitiesList}
        )}`
    )
        .then((response) => {
            return response.json();
        })
        .then((citiesInfo) => {
            let cityNames = Object.keys(citiesInfo);
            let crimeTypeCounts = {};

            for (let cityName of cityNames) {
                let cityInfo = citiesInfo[cityName];

                for (let crimeType in cityInfo) {
                    if (!crimeTypeCounts.hasOwnProperty(crimeType)) {
                        crimeTypeCounts[crimeType] = [];
                    }
                    crimeTypeCounts[crimeType].push(cityInfo[crimeType]);
                }
            }

            let data = [];
            for (let crimeType of crimeTypes) {
                let trace = getStackedBarTraces(
                    cityNames,
                    crimeTypeCounts[crimeType],
                    crimeType
                );
                data.push(trace);
            }

            let layout = getBarModeLayout(
                barModes.Stack,
                "Crimes by City and Crime Category",
                "City",
                "Number of Crimes",
            );

            Plotly.newPlot("stacked-bar-graph", data, layout);
        });
}

function getMonthName(monthNum) {
    var months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    return months[monthNum - 1];
}

function generateCrimeTables(city, start, end, cities) {
    if (cities) {
        cities = JSON.stringify(cities);
    }
    fetch(`http://127.0.0.1:5000/crimes_rate_given_city?dropdownCity=${city}&cityName=${city}&start=${start}&end=${end}&cities=${cities}`)
        .then((response) => {
            return response.json();
        })
        .then((res) => {
            if ("crimeRate" in res) {
                let crimeRateBox = document.getElementById("crime-rate-box");
                crimeRateBox.innerHTML = res['crimeRate'];
                let crimeRateBoxLabel = document.getElementById("crime-rate-label");
                crimeRateBoxLabel.innerHTML = "per 1000 people";
                if (crimeRateSide === 'multiple') {
                    $('#crimeRateMultiple').collapse('toggle');
                    $('#crimeRateSingle').collapse('toggle');
                    crimeRateSide = 'single';
                }
            } else if ('crimeRateMap' in res) {
                let crimeRateMap = res['crimeRateMap']
                let dataContainer = document.getElementById('dataTableContainer');
                dataContainer.innerHTML = '';
                let newTable = document.createElement('table');
                newTable.setAttribute('id', 'table');
                dataContainer.appendChild(newTable);
                $("#table").bootstrapTable({
                    data: crimeRateMap,
                    columns: [
                        {
                            field: 'cityName',
                            title: 'City Name',
                            sortable: true
                        },
                        {
                            field: 'crimeRate',
                            title: 'Crime Rate',
                            sortable: true
                        }
                    ]
                });
                newTable.classList.add('table-dark');
                if (crimeRateSide === 'single') {
                    $('#crimeRateSingle').collapse('toggle');
                    $('#crimeRateMultiple').collapse('toggle');
                    crimeRateSide = 'multiple';
                }
            }
        })
}

function generateBubbleGraph(city, cities) {
    if (cities) {
        cities = JSON.stringify(cities);
    }
    fetch(`http://127.0.0.1:5000/area_population_given_city?cityName=${city}&cities=${cities}`)
        .then((response) => {
            return response.json();
        })
        .then((res) => {
            if ("info" in res) {
                let data = [res['info']]
                let layout = {
                    title: 'Population by Area of Cities',
                    height: 250,
                    xaxis: {title : "Area(mi<sup>2</sup>)"},
                    yaxis: {title: "Population"},
                };
                Plotly.newPlot('bubbleGraph', data, layout);
            }
        })
}

window.addEventListener("load", () => {
    // Initialize map
    $('#crimeRateSingle').collapse('toggle');
    $('#singleDataGraphs').collapse('toggle');
    $('#pieCollapse').collapse('toggle');
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
    mapChart = new MapChart("mapChart");
});

