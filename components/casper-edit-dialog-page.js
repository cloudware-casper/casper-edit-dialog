import { LitElement, css } from 'lit';
import { mediaQueriesBreakpoints } from './casper-edit-dialog-constants.js';


export class CasperEditDialogPage extends LitElement {
  static properties = {
    type: {
      type: String
    },
    isNew: {
      type: Boolean,
      reflect: true
    },
    layout: {
      type: String,
      reflect: true
    }
  };

  static styles = css`
    :host {
      --item-min-width: 14.5rem;
      --heading-margin-top: 1.6em;
      --heading-margin-bottom: 1.1em;
      --column-gap: 1.25rem;

      row-gap: 0.625rem;
      column-gap: var(--column-gap);
    }

    .ced-page__heading {
      font-size: 1rem;
      font-weight: 600;
      padding: 0.625em;
      border-radius: 4px;
      margin: var(--heading-margin-top) 0 var(--heading-margin-bottom) 0;
      background-color: #efefef;
      color: var(--primary-color);
    }

    .ced-page__heading:first-child {
      margin-top: 0;
    }

    casper-tabbed-items {
      --header-before-height: var(--ced-page-padding);
    }


    /* GRID VERSION */

    :host([layout="grid"]) {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(var(--item-min-width), 1fr));
      grid-auto-rows: minmax(min-content, max-content);
      align-content: start;
    }

    :host([layout="grid"]) paper-checkbox {
      justify-self: flex-start;
    }

    :host([layout="grid"]) .ced-page__heading,
    :host([layout="grid"]) .ced-page__span-all,
    :host([layout="grid"]) casper-tabbed-items {
      grid-column: 1 / -1;
    }

    :host([layout="grid"]) .ced-page__span-2 {
      grid-column: span 2;
    }


    /* FLEXBOX VERSION */

    :host([layout="flex"]) {
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;
    }

    :host([layout="flex"]) .ced-page__heading {
      width: 100%;
    }

    :host([layout="flex"]) > *:not(.ced-page__heading) {
      width: calc((100% - var(--column-gap) * 2) / 3 );
      min-width: var(--item-min-width);
      max-width: 100%;
      flex-grow: 1;
    }

    @media (max-width: ${mediaQueriesBreakpoints.tablet}) {
      :host([layout="grid"]) > *:not(.ced-page__heading, .ced-page__span-all, .ced-page__span-2, casper-tabbed-items) {
        grid-column: auto !important;
      }

      :host([layout="grid"]) .ced-page__span-2 {
        grid-column: 1 / -1 !important;
      }
    }
  `;

  constructor () {
    super();

    this.layout = 'grid';
  }



  //***************************************************************************************//
  //                              ~~~ Public methods  ~~~                                  //
  //***************************************************************************************//

  validate () {
    console.warn('A validate method should be defined for the page.');
    return true;
  }

  // validates all fields which have the "required" attribute
  validateRequiredFields () {
    if (!this._requiredFields) {
      this._requiredFields = this.shadowRoot.querySelectorAll('[required]');

      for (const element of this._requiredFields) {
        element.addEventListener('keydown', (event) => this.clearFieldErrorMessage(event?.currentTarget));
      }
    }

    let isValid = true;

    for (const element of this._requiredFields) {
      const nodeName = element.nodeName.toLowerCase();

      switch (nodeName) {
        case 'paper-input':
          if (element.value.toString().trim() === '') {
            element.invalid = true;
            element.errorMessage = 'Campo obrigatório.';
            isValid = false;
          }
          break;
        default:
          break;
      }
    }

    return isValid;
  }

  clearFieldErrorMessage (element) {
    if (element?.invalid) {
      element.invalid = false;
      element.errorMessage = ''; 
    }
  }

  handleFieldsErrorMessageClear (elementsArr) {
    for (const element of elementsArr) {
      element.addEventListener('keydown', (event) => this.clearFieldErrorMessage(event?.currentTarget));
    }
  }

  async load (data) {
    this.__isNew = !data;
    await this.beforeLoad(data);

    if (!this.__type) this.__type = this.getRootNode().host.options.root_dialog;
    if (this.__isNew) return;

    for (const elem of this.shadowRoot.querySelectorAll('[binding]')) {
      const binding = elem.getAttribute('binding');
      //  const relType = elem.dataset.relationshipType; might implement later
      const relAttribute = elem.dataset.relationshipAttribute;
      let route, id, value, relationship;

      if (data[binding]) {
        // set attribute from binding key
        value = data[binding];
      } else if (data.relationships) {
        // check for attribute within relationships
        // check within previously loaded element
        if (data.relationships[this.__type]?.element) {
          // using page type attribute
          value = data.relationships[this.__type].element[relAttribute] ?? data.relationships[this.__type].element[binding];
        } else if (data.relationships[binding]?.element) {
          // using element binding
          value = data.relationships[binding].element[relAttribute] ?? data.relationships[binding].element[binding];
        } else {
          // data does not contain relationship data loaded into element
          // attempt to get relationship data via broker
          // use page type attribute to get relationship route and id
          if (this.__type && data.relationships[this.__type]?.data) {
            if (Array.isArray(data.relationships[this.__type].data)) {
              // only load first entry by default if array
              route = data.relationships[this.__type].data[0].type;
              id = data.relationships[this.__type].data[0].id;
            } else {
              route = data.relationships[this.__type].data.type;
              id = data.relationships[this.__type].data.id;
            }

            relationship = this.__type;
          } else {
            // cycle relationships looking for a match with binding in order to get route and id
            Object.keys(data.relationships).forEach((key) => {
              // if key matches binding, retrieve route and id from first entry
              if (key == binding && data.relationships[key]?.data) {
                if (Array.isArray(data.relationships[key].data)) {
                  // only load first entry by default if array
                  route = data.relationships[key].data[0].type;
                  id = data.relationships[key].data[0].id;
                } else {
                  route = data.relationships[key].data.type;
                  id = data.relationships[key].data.id;
                }

                relationship = binding;
              }
            });
          }

          if (route && id) {
            const response = await app.broker.get(`${route}/${id}`, 10000);
            data.relationships[relationship].element = {};

            if (response.data) {
              data.relationships[relationship].element = response.data;

              value = relAttribute ? response.data[relAttribute] : response.data[binding];
            }
          }
        }
      }

      if (value) {
        value = this.onLoad(value, elem, data);
        this._setValue(elem, value, data);
      }
    }

    this.afterLoad(data);
  }

  hasUnsavedChanges (data) {
    if (this.isSaved) return false;

    for (const elem of this.shadowRoot.querySelectorAll('[binding]')) {
      let hasNewValue, elemValue;
      const binding = elem.getAttribute('binding');
      const relAttribute = elem.dataset.relationshipAttribute;
      const initialValue = this.__isNew ? null : this._getValue(binding, relAttribute, data);

      switch (elem.tagName.toLowerCase()) {
        case 'paper-checkbox':
          hasNewValue = elem.checked != (initialValue || false);
          break;
        case 'paper-input':
        default:
          elemValue = elem.value || null;
          if (elemValue || initialValue) {
            hasNewValue = elemValue != initialValue;
          }
          break;
      }

      if (hasNewValue) return true;
    }

    return false;
  }

  save (saveData, data) {
    const request = this.__isNew ? 'post' : 'patch';
    if (this.__isNew) data = { relationships: {} };

    this.beforeSave(saveData, data);

    for (const elem of this.shadowRoot.querySelectorAll('[binding]')) {
      let elemValue, newValue;
      const binding = elem.getAttribute('binding');
      const relAttribute = elem.dataset.relationshipAttribute;
      const initialValue = this.__isNew ? null : this._getValue(binding, relAttribute, data);

      switch (elem.tagName.toLowerCase()) {
        case 'paper-checkbox':
          newValue = elem.checked !== initialValue ? elem.checked : null;
          break;
        case 'paper-input':
        default:
          elemValue = elem.value || null;
          if (elemValue !== initialValue) newValue = elemValue;
          break;
      }

      if (newValue !== undefined && initialValue !== newValue) {
        let type = data.relationships[binding]?.data?.type ?? (data.relationships[this.__type]?.data?.type ?? this.__type);
        let id = data.relationships[binding]?.data?.id ?? (data.relationships[this.__type]?.data?.id ?? data.id);
        let attribute = relAttribute ?? binding;

        if (!saveData[request][type]) {
          saveData[request][type] = {
            payloads: [{
              relationship: this.__type,
              urn: `${type}${!this.__isNew ? '/' + id : ''}`,
              payload: {
                data: {
                  type: type,
                  attributes: {}
                }
              }
            }]
          }

          if (request == 'patch') {
            saveData[request][type]['payloads'][0]['payload']['data']['id'] = id;
          }
        }

        saveData[request][type].payloads[0].payload.data.attributes[attribute] = newValue;
      }
    }

    this.onSave(saveData, data);
  }

  showStatusPage (response, status) {
    this.editDialog.showStatusPage(response, status);
  }

  hideStatusAndProgress () {
    this.editDialog.hideStatusAndProgress();
  }

  disableLabels () {
    this.editDialog.disableLabels();
  }

  enableLabels () {
    this.editDialog.enableLabels();
  }

  disablePrevious () {
    this.editDialog.disablePrevious();
  }

  enablePrevious () {
    this.editDialog.enablePrevious();
  }

  disableNext () {
    this.editDialog.disableNext();
  }

  enableNext () {
    this.editDialog.enableNext();
  }

  disableAllActions () {
    this.editDialog.disableAllActions();
  }

  enableAllActions () {
    this.editDialog.enableAllActions();
  }

  openToast (text, type, duration) {
    this.editDialog.openToast(text, type, duration);
  }

  close () {
    this.editDialog.close();
  }

  async beforeLoad (data) {
    return;
  }

  onLoad (value, elem, data) {
    return value;
  }

  async afterLoad (data) {
    return;
  }

  beforeSave (saveData, data) {
    return;
  }

  onSave (saveData, data) {
    return;
  }

  afterSave (saveData, data) {
    return;
  }

  updatePageData (saveData, data) {
    for (const [operation, types] of Object.entries(saveData)) {
      if (operation !== 'delete') {
        for (const [type, typeData] of Object.entries(types)) {
          if (typeData.response) {
            typeData.payloads.forEach((entry) => {
              if (entry.payload?.data?.attributes) {
                for (const [key, value] of Object.entries(entry.payload.data.attributes)) {
                  if (type == this.__type && data[key]) {
                    data[key] = value;
                  } else if (data.relationships?.[entry.relationship]?.element?.[key]) {
                    data.relationships[entry.relationship].element[key] = value;
                  } else if (data.relationships?.[type]?.element?.[key]) {
                    data.relationships[type].element[key] = value;
                  }
                }
              }
            });
          }
        }
      }
    }

    return data;
  }

  //***************************************************************************************//
  //                              ~~~ Private methods  ~~~                                 //
  //***************************************************************************************//

  _getValue (binding, relAttribute, data) {
    let value = null;

    if (data[binding]) {
      // set attribute from key
      value = data[binding];
    } else if (data.relationships) {
      // only load first entry by default
      if (this.__type && data.relationships[this.__type]) {
        value = data.relationships[this.__type].element[binding];
      } else {
        Object.keys(data.relationships).forEach((key) => {
          if (key == binding) {
            if (relAttribute && data.relationships[binding]?.element?.[relAttribute]) {
              value = data.relationships[binding].element[relAttribute];
            } else if (data.relationships[binding]?.element?.[binding]) {
              value = data.relationships[binding].element[binding];
            }
          }
        });
      }
    }

    return value;
  }

  _setValue (elem, value, data = null) {
    switch (elem.tagName.toLowerCase()) {
      case 'paper-checkbox':
        elem.checked = value;
        break;
      case 'casper-select-lit':
        elem.initialId = value;
        break;
      case 'paper-input':
      default:
        elem.value = value;
        break;
    }
  }
}