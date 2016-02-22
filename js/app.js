'use strict';

function parseXML (fileContent) {
    let domParser = new DOMParser();
    let xml = domParser.parseFromString(fileContent, "text/xml");

    let items = Array.from(xml.getElementsByTagName('item'));

    return items.map((item) => {
        let attributes = {};
        attributes.key = item.getElementsByTagName('key')[0].innerHTML;
        attributes.title = item.getElementsByTagName('summary')[0].innerHTML;
        attributes.description = item.getElementsByTagName('description')[0].innerHTML;
        let timeestimate = item.getElementsByTagName('timeestimate')[0];
        attributes.timeestimate = timeestimate ? timeestimate.getAttribute('seconds') : null;

        /* Custom fields */
        let customFields = Array.from(item.getElementsByTagName('customfields')[0].children);
        customFields.forEach((customField) => {
            if (customField.id === 'customfield_12310293') {
                attributes.effort = parseInt(customField.getElementsByTagName('customfieldvalue')[0].innerHTML);
            }
            if (customField.id === 'customfield_12311120') {
                attributes.epicLink = customField.getElementsByTagName('customfieldvalue')[0].innerHTML;
            }
        });
        return attributes;
    })
}

function onUpload (event) {
    let fileList = Array.from((event && event.dataTransfer) ? event.dataTransfer.files : $fileInput.files);

    fileList.forEach((file) => {
        let fileReader = new FileReader();
        fileReader.onloadend = (e) => {
            jiras.add(parseXML(e.target.result));
        };
        fileReader.readAsText(file);
    });
}

class JiraModel {
    constructor (attributes) {
        this.key = attributes.key;
        this.title = attributes.title;
        this.description = attributes.description;
        this.timeestimate = attributes.timeestimate ? attributes.timeestimate : 0;
        this.effort = attributes.effort ? attributes.effort : 0;
        this.epicLink = attributes.effort ? attributes.epicLink : null;
        console.log(this);
    }

    static isValid (attributes) {
        return attributes && attributes.key && attributes.title;
    }
}

class JiraView {
    constructor (model) {
        this.model = model;
    }

    decodeHTML (html) {
        let domParser = new DOMParser();
        let doc = domParser.parseFromString(html, "text/html");
        return doc.documentElement.textContent;
    }

    render () {
        this.element = `<article class="card" id="${this.model.key}">
        		<h5 class="card-key">${this.model.key}</h5>
                <h2 class="card-title">${this.decodeHTML(this.model.title)}</h2>
                <div class="card-description"><h4>Description :</h4>${this.decodeHTML(this.model.description)}</div>
                <div class="card-requirements">
                <div class="requirement" data-requirement="token">Tokens</div>
                <div class="requirement" data-requirement="UI">Validation UI</div>
                <div class="requirement" data-requirement="TU">Tests unitaires</div>
                <div class="requirement" data-requirement="TF">Tests fonctionnels</div>
                <div class="requirement" data-requirement="PR">PR Green</div>
                </div>
            </article>`;
        return this;
    }

    destroy () {

    }
}

class JiraCollection {
    constructor () {
        this.models = new Map();
        this.views = new Map();
        this.element = document.getElementById('cards');
    }

    _insertModel (attributes) {
        if (!JiraModel.isValid(attributes)) {
            return alert('XML invalide');
        }
        if (this.models.has(attributes.key)) {
            return;
        }

        let model = new JiraModel(attributes);
        let view = new JiraView(model);
        this.models.set(attributes.key, model);
        this.views.set(attributes.key, view);
        this.displayChildView(view);
    }

    add (models) {
        if (Array.isArray(models)) {
            models.forEach(this._insertModel, this);
        } else {
            this._insertModel(models);
        }
    }

    displayChildView (view) {
        view.render();
        this.element.innerHTML += view.element;
    }

    delete (key) {
        if (!this.models.has(key)) {
            return false;
        }
        this.views.get(key).destoy();
        this.views.delete(key);
        this.models.delete(key);
        return true;
    }
}

const $fileInput    = document.querySelector('#file')
const jiras         = new JiraCollection();

$fileInput.onchange = onUpload;
