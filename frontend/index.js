import "babel-polyfill";
import * as L from "leaflet";
window.$ = require("jquery");
import "bootstrap";
import * as legoIO from "/img/legoio.png";
import * as shadow from "/img/shadow.png";

////////////////////////////////////////////////////////////////////////////////////

var updateInterval = 2000;

/**
 * get cityIO method [uses polyfill]
 * @param cityIOtableURL cityIO API endpoint URL
 */
async function getCityIO(url) {
    var myHeaders = {
        headers: new Headers({
            Authorization:
                "Bearer 86c1e6d8f574a51896bf02e8622b858d573b8afd4e583d3b9258cfe8ed336ee7",
        }),
    };

    return fetch(url, myHeaders)
        .then(function (response) {
            return response.json();
        })
        .then(function (cityIOdata) {
            return cityIOdata;
        })
        .catch((err) => {
            console.log(err);
        });
}
//

async function postCityIO(url, data) {
    var myHeaders = {
        headers: new Headers({
            Authorization:
                "Bearer 86c1e6d8f574a51896bf02e8622b858d573b8afd4e583d3b9258cfe8ed336ee7",
        }),
        method: "POST",
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    };

    return fetch(url, myHeaders)
        .then(function (response) {
            return response.json();
        })

        .catch((err) => {
            console.log(err);

            return JSON.stringify(err);
        });
}

////////////////////////////////////////////////////////////////////////////////////
function clearNames(url) {
    return url
        .toString()
        .replace("https://cityio.media.mit.edu/api/table/", "");
}
////////////////////////////////////////////////////////////////////////////////////

async function getTables() {
    let counter = 0;
    let tableArray = [];
    let cityioTablesList = "https://cityio.media.mit.edu/api/tables/list";

    const tables = await getCityIO(cityioTablesList);

    for (let i = 0; i < tables.length; i++) {
        let thisTable = await getCityIO(tables[i]);

        // make sure we can actually GET the table now
        if (thisTable) {
            let thisTableName = clearNames(tables[i]);
            infoDiv(
                i +
                    1 +
                    "/" +
                    tables.length +
               
                    " _ ".link(
                        "https://cityio.media.mit.edu/api/table/clear/" +
                            thisTableName
                    ) +
                    "   " +
                    clearNames(tables[i]).link(tables[i])
            );

            let thisTableHeader = thisTable.header;
            let tableSpatial;
            if (
                thisTableHeader &&
                thisTableHeader.spatial &&
                thisTableHeader.spatial.longitude &&
                thisTableHeader.spatial.latitude
            ) {
                tableSpatial = thisTableHeader.spatial;
            } else {
                counter = counter + 1;

                tableSpatial = { latitude: 0, longitude: 0 };
            }

            tableArray.push({
                url: tables[i],
                name: thisTableName,
                lat: tableSpatial.latitude,
                lon: tableSpatial.longitude,
            });
        }
    }

    makeMap(tableArray, counter);
}

////////////////////////////////////////////////////////////////////////////////////

function makeMap(tablesArray) {
    var map = L.map("map").setView([51.505, -0.09], 1);
    // setup the map API
    L.tileLayer(
        "https://api.mapbox.com/styles/v1/relnox/cjg1ixe5s2ubp2rl3eqzjz2ud/tiles/512/{z}/{x}/{y}?access_token=pk.eyJ1IjoicmVsbm94IiwiYSI6ImNqd2VwOTNtYjExaHkzeXBzYm1xc3E3dzQifQ.X8r8nj4-baZXSsFgctQMsg",
        {
            maxZoom: 15,
            minZoom: 2,
        }
    ).addTo(map);
    //hide leaflet link
    document.getElementsByClassName(
        "leaflet-control-attribution"
    )[0].style.display = "none";
    document.getElementsByClassName(
        "leaflet-top leaflet-left"
    )[0].style.display = "none";
    //lock map to relevant area view
    map.setMaxBounds(map.getBounds());

    ///////////////Map icons///////////////////////
    // create a costum map icon [cityIO or non]
    var iconSize = 30;
    var IOIcon = L.icon({
        iconUrl: legoIO.default,
        iconSize: [iconSize, iconSize],
        iconAnchor: [0, 40],
        popupAnchor: [0, -40],
        shadowUrl: shadow.default,
        shadowSize: [iconSize, iconSize],
        shadowAnchor: [0, 10],
    });

    for (var i = 0; i < tablesArray.length; i++) {
        let rndPos = [
            tablesArray[i].lat + Math.random() * 10,
            tablesArray[i].lon + Math.random() * 10,
        ];
        var polylinePoints = [rndPos, [tablesArray[i].lat, tablesArray[i].lon]];

        L.polyline(polylinePoints, {
            color: "#ed5066",
            width: "1px",
            weight: 3,
            opacity: 0.5,
            smoothFactor: 1,
        }).addTo(map);

        //clear names of tables
        let url = tablesArray[i].url;
        url = clearNames(url);
        //create map marker
        let marker = new L.marker(rndPos, {
            icon: IOIcon,
        })
            .bindPopup("CityScope " + url)
            .addTo(map);
        marker.properties = tablesArray[i];

        marker.on("mouseover", function () {
            this.openPopup();
        });
        marker.on("mouseout", function () {
            this.closePopup();
        });
        marker.on("click", function () {
            //pass the marker data to setup method
            modalSetup(marker);
            infoDiv("getting header for: " + url);
        });
    }

    // click event handler to creat a chart and show it in the popup
    async function modalSetup(m) {
        //get the divs for content
        var tableNameDiv = document.getElementById("tableNameDiv");
        //get the binded props
        let tableMeta = m.properties;
        tableNameDiv.innerHTML = clearNames(m.properties.url);

        //put prj name in div
        let removeTableURL =
            "https://cityio.media.mit.edu/api/table/clear/" + tableMeta.name;

        // !
        let responseDiv = document.getElementById("responseDiv");
        responseDiv.innerHTML = "server response will appear here..";
        var postButton = document.getElementById("post");
        postButton.onclick = async function (event) {
            event.preventDefault();
            var fieldName = document.getElementById("fieldName");
            var JSONdata = document.getElementById("JSONdata");
            let postURL =
                "https://cityio.media.mit.edu/api/table/update/" +
                tableMeta.name +
                "/" +
                fieldName.value.toString();
            let postData = JSONdata.value;
            postData = postData.split("\r\n");

            for (var i = 0; i < postData.length; i++) {
                postData[i] = JSON.parse(postData[i]);
                console.log(postData[i]);
            }
            postData = postData[0];
            console.log(postData);

            let res = await postCityIO(postURL, postData);

            responseDiv.innerHTML = JSON.stringify(res);
        };

        var deleteButton = document.getElementById("delete");

        deleteButton.onclick = async function (event) {
            event.preventDefault();
            var moduleName = document.getElementById("fieldName");
            let delFieldURL =
                removeTableURL + "/" + moduleName.value.toString();
            let res = await getCityIO(delFieldURL);
            responseDiv.innerHTML = JSON.stringify(res);
        };

        //stop update on modal close
        $("#modal").on("hide.bs.modal", function () {
            clearInterval(refreshIntervalId);
        });

        update(tableMeta.url);
        //start interval fix set interval that way:
        //http://onezeronull.com/2013/07/12/function-is-not-defined-when-using-setinterval-or-settimeout/
        var refreshIntervalId = setInterval(function () {
            update(tableMeta.url);
        }, updateInterval);
        //open up the modal
        $("#modal").modal("toggle");
    }
}

////////////////////////////////////////////////////////////////////////////////////

async function update(url) {
    const cityIOjson = await getCityIO(url);

    // only show table header
    let jsonMerge = {};
    $.extend(jsonMerge, cityIOjson.meta, cityIOjson.header);
    let cityIOjsonString = JSON.stringify(jsonMerge, null, 2);
    let tableHeaderDiv = document.getElementById("tableHeaderDiv");
    tableHeaderDiv.innerHTML = "";
    //
    output(syntaxHighlight(cityIOjsonString));
    //
    function output(inp) {
        tableHeaderDiv.appendChild(
            document.createElement("pre")
        ).innerHTML = inp;
    }
}

//
function syntaxHighlight(json) {
    json = json
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    return json.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        function (match) {
            var cls = "number";
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = "key";
                } else {
                    cls = "string";
                }
            } else if (/true|false/.test(match)) {
                cls = "boolean";
            } else if (/null/.test(match)) {
                cls = "null";
            }
            return '<span class="' + cls + '">' + match + "</span>";
        }
    );
}
////////////////////////////////////////////////////////////////////////////////////
//make info div [on screen console] or add text to it
function infoDiv(text) {
    let d = document.getElementById("log");
    // clear div if too much text
    if (d.scrollHeight > 5000) {
        d.innerHTML = null;
    } else {
        d.innerHTML += text + "<p></p>";
        d.scrollTop = d.scrollHeight;
    }
    return;
}

//////////////////////////////////////////
// APP START
//////////////////////////////////////////
getTables();
