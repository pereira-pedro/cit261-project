class DataList {
    constructor(target) {
        this.target = document.getElementById(target);
    }

    addElement(option) {
        if (option instanceof Array) {
            option.forEach(element => {

                var o = document.createElement('option');
                o.value = element.value;
                o.text = element.text;

                this.target.appendChild(o);
            });
            return;
        }

        // only a single object 
        var o = document.createElement('option');
        o.value = option.value;
        o.text = option.text;

        this.target.appendChild(o);
    }

    empty() {
        var f;
        while ((f = this.target.firstElementChild)) {
            this.target.removeChild(f);
        }
    }
}