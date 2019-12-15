const _api = {
  host: "apidojo-yahoo-finance-v1.p.rapidapi.com",
  key: "354a251140mshf27709a6ed368a8p109c2cjsn341179353f81",
  lang: "en",
  region: "US"
};

var _stockChart = null;
var _logHistory;

const onDOMLoaded = () => {
  const companySelector = document.getElementById("company-selector");
  _logHistory = document.getElementById("log-history");
  _logHistory.innerText = "joao";

  window.addEventListener("resize", () => {
    var event = new Event("change");
    companySelector.dispatchEvent(event);
  });

  new AutoComplete("company-selector", "progress-bar", selectCompany);
};

if (
  document.readyState === "complete" ||
  (document.readyState !== "loading" && !document.documentElement.doScroll)
) {
  onDOMLoaded();
} else {
  window.addEventListener("DOMContentLoaded", onDOMLoaded);
}

selectCompany = () => {
  const company = document.getElementById("company-selector");

  if (!("symbol" in company.dataset) || company.dataset.symbol.length === 0) {
    return;
  }
  document.getElementById("company-name").innerText = company.dataset.name;
  document.getElementById("company-header").style.display = "flex";

  drawCompanyChart(company.dataset.symbol);
};

drawCompanyChart = company => {
  const stockChart = document.getElementById("stock-chart");
  const progressBar = document.getElementById("progress-spinner");
  const message = document.getElementById("message");

  progressBar.style.display = "block";
  stockChart.style.display = "none";
  message.innerHTML = "";

  if (_stockChart !== null) {
    _stockChart.clearChart();
  }

  _apiGet(
    "https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-chart",
    {
      interval: document.getElementById("interval").value,
      symbol: company,
      range: document.getElementById("range").value
    },
    response => {
      if (!("timestamp" in response.chart.result[0])) {
        message.innerHTML = "<i>There's no data to show.</i>";
        return;
      }
      google.charts.load("current", { packages: ["corechart"] });
      google.charts.setOnLoadCallback(() => _drawChart(response));
    },
    error => {
      showDialogMessage(error);
    },
    () => {
      stockChart.style.display = "block";
      progressBar.style.display = "none";
    }
  );
};

_apiGet = (uri, query, handlerThen, handlerCatch, handleFinally) => {
  const url = new URL(uri);

  query.lang = _api.lang;
  query.region = _api.region;

  url.search = new URLSearchParams(query).toString();

  fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-host": _api.host,
      "x-rapidapi-key": _api.key
    }
  })
    .then(response => {
      return response.json();
    })
    .then(json => {
      handlerThen(json);
    })
    .catch(err => {
      handlerCatch(err);
    })
    .finally(() => {
      if (handleFinally !== undefined) {
        handleFinally();
      }
    });
};

openMenu = () => {
  document.getElementById("menu").style.width = "100%";
};

closeMenu = () => {
  document.getElementById("menu").style.width = "0%";
};

addCompany = () => {
  const company = document.getElementById("company-selector");

  if (!("symbol" in company.dataset) || !("name" in company.dataset)) {
    return;
  }
  var companies = JSON.parse(localStorage.getItem("company_list"));
  if (companies === null) {
    companies = [];
  }
  if (companies.find(c => c.value === company.dataset.name) === undefined) {
    companies.push({
      symbol: company.dataset.symbol,
      name: company.dataset.name
    });
  }
  localStorage.setItem("company_list", JSON.stringify(companies));
};

customizeChart = () => {
  const company = document.getElementById("company-selector");

  closeMenu();

  if ("symbol" in company.dataset && company.dataset.symbol.length > 0) {
    drawCompanyChart(company.dataset.symbol);
  }
};

_drawChart = response => {
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
    legend: "none"
  };

  if (_stockChart === null) {
    _stockChart = new google.visualization.CandlestickChart(
      document.getElementById("stock-chart")
    );
  }

  _stockChart.draw(data, options);
};

showDialogMessage = message => {
  document.getElementById("dialog-message-text").innerText = message;
  document.getElementById("dialog-message").style.display = "flex";
};

closeDialogMessage = () => {
  document.getElementById("dialog-message").style.display = "none";
};
