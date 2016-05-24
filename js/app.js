'use strict';

localStorage.setItem('storyPointsFieldId', '');

class JiraModel {
    constructor (attributes) {
        this.parse(attributes);
        this.blocks = [];
        this.isBlockedBy = [];
    }

    parse (attributes) {
        this.key = attributes.key || this.key;
        this.summary = attributes.summary || this.summary;
        this.description = attributes.description || this.description;
        this.timeestimate = attributes.timeestimate ? (attributes.timeestimate / 3600 / 7) + 'd' : this.timeestimate;
        this.effort = attributes[localStorage.getItem('storyPointsFieldId')] || this.effort;
        if (attributes.issuelinks) {
            attributes.issuelinks.forEach(this.registerLinksIssue.bind(this));
        }
    }

    registerLinksIssue (issue) {
        if (issue.outwardIssue) {
            this.blocks.push(issue.outwardIssue.key);
        }
        if (issue.inwardIssue) {
            this.isBlockedBy.push(issue.inwardIssue.key);
        }
    }

    onSuccess (callback, response) {
        this.parse(response.fields);
        if (callback) {
            callback(response);
        }
    }

    fetch (callback) {
        $.ajax({
            url: `${localStorage.getItem('jiraRestApiBaseUrl')}/issue/${this.key}`,
            dataType: 'json',
            success: this.onSuccess.bind(this, callback),
            error: function () {
                alert('API error. Please verify the settings.');
            }
        });
    }
}

class JiraView {
    constructor (model) {
        this.model = model;
    }

    bindElement () {
        this.$element = document.querySelector(`#${this.model.key}`);
        this.$element.querySelector('.remove').onclick = function () {
            jiras.delete(this.model.key);
        }.bind(this);
    }

    render () {
        this.element = `<article class="card" id="${this.model.key}">
        		<div class="card-key">${this.model.key}</div>
                <h2 class="card-title">${this.model.summary}</h2>
                <div class="card-description">${this.model.description}</div>
                <div class="card-complexity">${this.model.effort || this.model.timeestimate || ''}</div>
                <div class="card-links">`;
        if (this.model.blocks.length) {
            this.element += `<div class="card-blocks">Blocks: ${this.model.blocks.join(', ')}</div>`;
        }
        if (this.model.isBlockedBy.length) {
            this.element += `<div class="card-isBlockedBy">Is blocked by: ${this.model.isBlockedBy.join(', ')}</div>`;
        }
        this.element += `</div><div class="remove">X</div></article>`;
        return this;
    }

    destroy () {
        this.$element.remove();
    }
}

class JiraCollection {
    constructor () {
        this.models  = new Map();
        this.views   = new Map();
        this.element = document.getElementById('cards');
    }

    _insertModel (model) {
        if (this.models.has(model.key)) {
            return;
        }
        let view = new JiraView(model);
        this.models.set(model.key, model);
        this.views.set(model.key, view);
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
        view.bindElement();
    }

    delete (key) {
        if (!this.models.has(key)) {
            return false;
        }
        this.views.get(key).destroy();
        this.views.delete(key);
        this.models.delete(key);
        return true;
    }
}

const jiras  = new JiraCollection();
const $input = document.querySelector('#jiraKey');
const $settingsContainer = document.querySelector('#settings-container');
const $settingsURL = $settingsContainer.querySelector('#jiraBaseUrl');
const $settingsStoryPoints = $settingsContainer.querySelector('#jiraStoryPoints');

$settingsURL.value = localStorage.getItem('jiraRestApiBaseUrl');
$settingsStoryPoints.value = localStorage.getItem('storyPointsFieldName');

var initModel = function (key) {
    let jira = new JiraModel({
        key: key
    });
    jira.fetch(function () {
        jiras.add(jira);
    });
    $input.value = '';
};

var getStoryPointsFieldId = function (key) {
    $.getJSON({
        url: `${localStorage.getItem('jiraRestApiBaseUrl')}/field`,
        dataType: 'json',
        success: function (response) {
            response.forEach(function (field) {
                if (field.name === localStorage.getItem('storyPointsFieldName')) {
                    localStorage.setItem('storyPointsFieldId', field.id);
                    return false;
                }
                return true;
            });
            console.log(localStorage.getItem('storyPointsFieldId'));
            initModel(key);
        },
        error: function () {
            alert('API error. Please verify the settings.');
        }
    });
};

document.querySelector('#addJIRA').onsubmit = function () {
    let key = $input.value;

    if (!key) {
        alert('Please enter a JIRA key.');
    } else if (!localStorage.getItem('jiraRestApiBaseUrl')) {
        alert('Please add a JIRA API BASE URL in the settings before continue.');
    } else if (!localStorage.getItem('storyPointsFieldId')) {
        getStoryPointsFieldId(key);
    } else {
        initModel(key);
    }

    return false;
};

var toggleSettings = function () {
    $settingsContainer.classList.toggle('show');
};

document.querySelector('#settingsForm').onsubmit = function () {
    localStorage.setItem('jiraRestApiBaseUrl', $settingsURL.value);
    localStorage.setItem('storyPointsFieldName', $settingsStoryPoints.value);
    localStorage.setItem('storyPointsFieldId', '');
    toggleSettings();
    return false;
};

document.querySelector('#print').onclick = function () {
    window.print();
};

document.querySelector('#settings').onclick = toggleSettings;
