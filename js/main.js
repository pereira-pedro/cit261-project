const _api = {
    host: "apidojo-yahoo-finance-v1.p.rapidapi.com",
    key: "354a251140mshf27709a6ed368a8p109c2cjsn341179353f81",
    lang: 'en',
    region: 'US'
};

const _intervals = [
    { name: '1 minute', value: '1m' },
    { name: '2 minutes', value: '2m' },
    { name: '5 minutes', value: '5m' },
    { name: '15 minutes', value: '15m' },
    { name: '1 hour', value: '60m' },
    { name: '1 day', value: '1d' }
];

const _ranges = [
    { name: '1 day', value: '1d' },
    { name: '5 days', value: '5d' },
    { name: '1 month', value: '1mo' },
    { name: '3 months', value: '3mo' },
    { name: '6 months', value: '6mo' },
    { name: '1 year', value: '1y' },
    { name: '2 years', value: '2y' },
    { name: '5 years', value: '5y' },
    { name: '10 years', value: '10y' }
];

const onDOMLoaded = function () {
    const companySelector = document.getElementById('company-selector');

    companySelector.addEventListener('input', companyAutocomplete);
    companySelector.addEventListener('focus', companyList)
    companySelector.addEventListener('change', companySelected)
    window.addEventListener("resize", () => {
        var event = new Event('change');
        companySelector.dispatchEvent(event);
    });
};

if (
    document.readyState === "complete" ||
    (document.readyState !== "loading" && !document.documentElement.doScroll)
) {
    onDOMLoaded();
} else {
    document.addEventListener("DOMContentLoaded", onDOMLoaded);
}

function companyAutocomplete(e) {
    const query = e.target.value;

    // this is valid only if the user is typing
    if (!('inputType' in e)) {
        return;
    }

    // only queries with 4 characters
    if (query.length < 4) {
        return;
    }

    const datalist = new DataList('company-list');
    datalist.empty();

    _apiGet(
        'https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/auto-complete',
        {
            query: query
        },
        response => {
            const datalist = new DataList('company-list');
            datalist.empty();
            datalist.addElement(response.ResultSet.Result.map(row => {
                return {
                    value: row.symbol,
                    text: row.name
                };
            }));
        },
        error => {
            console.log(JSON.stringify(error));
        });
}

function companyList(e) {
    var items;

    if ((items = localStorage.getItem("company_list")) === null) {
        return;
    }
    const datalist = new DataList('company-list');
    const companyList = JSON.parse(items);

    datalist.empty();
    datalist.addElement(companyList);

    var keyboardEvent = document.createEvent("KeyboardEvent");
    var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";

    keyboardEvent[initMethod](
        "keypress", // event type : keydown, keyup, keypress
        true, // bubbles
        true, // cancelable
        window, // viewArg: should be window
        false, // ctrlKeyArg
        false, // altKeyArg
        false, // shiftKeyArg
        false, // metaKeyArg
        40, // keyCodeArg : unsigned long the virtual key code, else 0
        0 // charCodeArgs : unsigned long the Unicode character associated with the depressed key, else 0
    );
    e.target.dispatchEvent(keyboardEvent);
}

function companySelected(e) {
    const company = document.querySelectorAll(`option[value='${e.target.value}']`);

    document.getElementById("company-name").innerText = company[0].innerText;
    document.getElementById("company-header").style.display = "flex";

    drawCompanyChart(company[0].value);
}

function drawCompanyChart(company) {

    if (company === null) {
        return;
    }

    const stockChart = document.getElementById('stock-chart');
    const progressBar = document.getElementById('progress-bar');

    progressBar.style.display = 'block';
    stockChart.style.display = 'none';

    _apiGet(
        "https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-chart",
        {
            interval: document.getElementById("interval-data").value,
            symbol: company,
            range: document.getElementById("range-data").value
        },
        response => {
            stockChart.style.display = 'flex';
            progressBar.style.display = 'none';
            if (!('timestamp' in response.chart.result[0])) {
                document.getElementById("message").innerHTML = "<i>There's no data to show.</i>";
                return;
            }
            google.charts.load('current', { 'packages': ['corechart'] });
            google.charts.setOnLoadCallback(() => _drawChart(response));
        },
        error => {
            console.log(JSON.stringify(error));
            stockChart.style.display = 'block';
            progressBar.style.display = 'none';
        });

}

function _apiGet(
    uri,
    query,
    handlerThen,
    handlerCatch) {
    const url = new URL(uri)

    query.lang = _api.lang;
    query.region = _api.region;

    url.search = new URLSearchParams(query).toString();

    fetch(url, {
        "method": "GET",
        "headers": {
            "x-rapidapi-host": _api.host,
            "x-rapidapi-key": _api.key
        }
    })
        .then(response => {
            return response.json()
        })
        .then(json => {
            handlerThen(json);
        })
        .catch(err => {
            handlerCatch(err);
        });
}

function openMenu() {
    document.getElementById("menu").style.width = "100%";
}

function closeMenu() {
    document.getElementById("menu").style.width = "0%";
}

function addCompany() {
    const company = {
        value: document.getElementById("company-selector").value,
        text: document.getElementById("company-name").innerText
    }
    var companies = JSON.parse(localStorage.getItem("company_list"));
    if (companies === null) {
        companies = [];
    }
    if (companies.find(c => c.value === company.value) === undefined) {
        companies.push(company);
    }
    localStorage.setItem("company_list", JSON.stringify(companies));
}

function customizeChart() {
    const company = document.getElementById("company-selector").value;
    const interval = _intervals.find(x => x.name === document.getElementById("interval").value);
    const range = _ranges.find(x => x.name === document.getElementById("range").value);

    document.getElementById("interval-data").value = interval.value;
    document.getElementById("range-data").value = range.value;

    closeMenu();

    drawCompanyChart(company);
}

function _drawChart(response) {

    var dataSeries = [];
    response.chart.result[0].timestamp.forEach(row => {
        dataSeries.push([new Date(row * 1000), 0, 0, 0, 0]);
    });

    // Low
    var idx = 0;
    response.chart.result[0].indicators.quote[0].low.forEach(row => {
        dataSeries[idx][1] = row;
        idx++;
    });
    // Open
    idx = 0;
    response.chart.result[0].indicators.quote[0].open.forEach(row => {
        dataSeries[idx][2] = row;
        idx++;
    });
    // Close
    idx = 0;
    response.chart.result[0].indicators.quote[0].close.forEach(row => {
        dataSeries[idx][3] = row;
        idx++;
    });
    // High
    idx = 0;
    response.chart.result[0].indicators.quote[0].high.forEach(row => {
        dataSeries[idx][4] = row;
        idx++;
    });
    var data = google.visualization.arrayToDataTable(dataSeries, true);
    /*var options = {
        title: 'Rate the Day on a Scale of 1 to 10',
        width: 900,
        height: 500,
        hAxis: {
          format: 'M/d/yy',
          gridlines: {count: 15}
        },
        vAxis: {
          gridlines: {color: 'none'},
          minValue: 0
        }
      };*/
    var options = {
        legend: 'none'
    };

    var chart = new google.visualization.CandlestickChart(document.getElementById('stock-chart'));

    chart.draw(data, options);
}
