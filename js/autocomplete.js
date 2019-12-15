class AutoComplete {
  constructor(target, progress, selectHandler) {
    this._target = document.getElementById(target);
    this._progressBar = document.getElementById(progress);
    this._selectHandler = selectHandler;

    this._target.addEventListener("input", this._inputHandler);
    //this._target.addEventListener("change", this._inputHandler);
    this._target.addEventListener("keydown", this._keydownHandler);
    this._target.addEventListener("focus", this._focusHandler);

    _logHistory.innerText = "bastos";

    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", e => {
      _logHistory.innerText = "pedro";
      this._closeAllLists(e.target);
    });
  }

  _inputHandler = e => {
    var val = e.target.value;
    _logHistory.innerText = val;
    /*close any already open lists of autocompleted values*/
    this._closeAllLists();
    if (!val || val.length < 3) {
      return false;
    }

    this._currentFocus = -1;

    this._progressBar.style.display = "block";

    _apiGet(
      "https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/auto-complete",
      {
        query: val
      },
      response => {
        this._createList(response.ResultSet.Result);
      },
      error => {
        showDialogMessage(error);
      },
      () => {
        this._progressBar.style.display = "none";
      }
    );
  };

  _keydownHandler = e => {
    var element = document.getElementById(e.target.id + "autocomplete-list");
    if (element) {
      element = element.getElementsByTagName("div");
    }
    if (e.keyCode == 40) {
      /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
      this._currentFocus++;
      /*and and make the current item more visible:*/
      this._addActive(element);
    } else if (e.keyCode == 38) {
      //up
      /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
      this._currentFocus--;
      /*and and make the current item more visible:*/
      this._addActive(element);
    } else if (e.keyCode == 13) {
      /*If the ENTER key is pressed, prevent the form from being submitted,*/
      e.preventDefault();
      if (this._currentFocus > -1) {
        /*and simulate a click on the "active" item:*/
        if (element) {
          element[this._currentFocus].click();
        }
      }
    }
  };

  _focusHandler = e => {
    /*close any already open lists of autocompleted values*/
    this._closeAllLists();

    this._currentFocus = -1;

    var items = localStorage.getItem("company_list");
    if (items === null) {
      return;
    }

    this._createList(JSON.parse(items));
  };

  _createList = elements => {
    var a, b;

    /*create a DIV element that will contain the items (values):*/
    a = document.createElement("DIV");
    a.setAttribute("id", this._target.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");

    /*append the DIV element as a child of the autocomplete container:*/
    this._target.parentNode.appendChild(a);

    elements.forEach(row => {
      b = document.createElement("DIV");
      b.setAttribute("data-symbol", row.symbol);
      b.setAttribute("data-name", row.name);
      b.innerHTML = `${row.symbol} - ${row.name}`;

      b.addEventListener("click", e => {
        this._target.setAttribute("data-symbol", e.target.dataset.symbol);
        this._target.setAttribute("data-name", e.target.dataset.name);
        this._closeAllLists();

        this._selectHandler();
      });
      a.appendChild(b);
    });
  };

  _addActive = elements => {
    /*a function to classify an item as "active":*/
    if (!elements) {
      return false;
    }

    /*start by removing the "active" class on all items:*/
    this._removeActive(elements);

    if (this._currentFocus >= elements.length) {
      this._currentFocus = 0;
    }

    if (this._currentFocus < 0) {
      this._currentFocus = elements.length - 1;
    }

    /*add class "autocomplete-active":*/
    elements[this._currentFocus].classList.add("autocomplete-active");
  };

  _removeActive = elements => {
    /*a function to remove the "active" class from all autocomplete items:*/
    elements.forEach(row => {
      row.classList.remove("autocomplete-active");
    });
  };

  /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
  _closeAllLists = element => {
    if (element === undefined) {
      return;
    }
    const items = document.getElementsByClassName("autocomplete-items");

    if (items.length === 0) {
      return;
    }
    for (var i = 0; i < items.length; i++) {
      if (element != items[i] && element != this._target) {
        items[i].parentNode.removeChild(items[i]);
      }
    }
  };
}
