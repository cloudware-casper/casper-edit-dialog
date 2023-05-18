import { LitElement, css } from 'lit';


export class CasperEditDialogPage extends LitElement {
  static properties = {
    type: {
      type: String
    },
    layout: { 
      type: String, 
      reflect: true 
    }
  };

  static mediaQueriesBreakpoints = {
    mobile: css`30rem`,
    tablet: css`60rem`
  };

  static styles = css`
    :host {
      --item-min-width: 15rem;
      --heading-margin-top: 1.7em;
      --heading-margin-bottom: 1.2em;

      row-gap: 0.625rem;
      column-gap: 1.25rem;
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

    
    /* GRID VERSION */

    :host([layout="grid"]) {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(var(--item-min-width), 1fr));
      grid-auto-rows: minmax(min-content, max-content);
      align-content: start;
      align-items: center;
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
    }

    :host([layout="flex"]) .ced-page__heading {
      with: 100%;
    }


    @media (max-width: ${this.mediaQueriesBreakpoints.tablet}) {
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

  validate () {
    console.warn('A validate method should be defined for the page.')
    return true;
  }

  async load (data) {
    if (!this.__type) this.__type = this.getRootNode().host._options.root_dialog;
    if (!data) return;

    await this.beforeLoad(data);

    for (const elem of this.shadowRoot.querySelectorAll('[binding]')) {
      const binding = elem.getAttribute('binding');
      const relAttribute = elem.dataset.relationshipAttribute;
      let route, id, value, relationship;

      if (data[binding]) {
        // set attribute from key
        value = data[binding];
      } else if (data.relationships) {
        if (data.relationships[this.__type]?.element) {
          value = data.relationships[this.__type].element[relAttribute] ?? data.relationships[this.__type].element[binding];
        } else if (data.relationships[binding]?.element) {
          value = data.relationships[binding].element[relAttribute] ?? data.relationships[binding].element[binding];
        } else {
          // only load first entry by default
          if (this.__type && data.relationships[this.__type]?.data) {
            if (Array.isArray(data.relationships[this.__type].data)) {
              route = data.relationships[this.__type].data[0].type;
              id = data.relationships[this.__type].data[0].id;
            } else {
              route = data.relationships[this.__type].data.type;
              id = data.relationships[this.__type].data.id;
            }

            relationship = this.__type;
          } else {
            Object.keys(data.relationships).forEach((key) => {
              if (key == binding && data.relationships[key]?.data) {
                if (Array.isArray(data.relationships[key].data)) {
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
        this._setValue(elem, value, data);
      }
    }

    this.afterLoad(data);
  }

  save (saveData, data) {
    const isNew = data ? false : true;
    const request = isNew ? 'post' : 'patch';
    if(isNew) data = { relationships: {} };

    this.beforeSave(saveData, data);

    for (const elem of this.shadowRoot.querySelectorAll('[binding]')) {
      let newValue;
      const binding = elem.getAttribute('binding');
      const relAttribute = elem.dataset.relationshipAttribute;
      const initialValue = isNew ? null : this._getValue(binding, relAttribute, data);

      switch (elem.tagName.toLowerCase()) {
        case 'paper-checkbox':
          newValue = elem.checked !== initialValue ? elem.checked : null;
          break;
        case 'paper-input':
        default:
          newValue = elem.value !== initialValue ? elem.value : null;
          break;
      }

      if (newValue !== undefined && newValue !== null) {
        let type = data.relationships[this.__type]?.data.type ?? this.__type;
        let id = data.relationships[this.__type]?.data.id ?? data.id;
        let attribute = relAttribute ?? binding;

        if (!saveData[request][type]) {
          saveData[request][type] = {
            payloads: [{
              urn: `${type}${!isNew ? '/' + id : ''}`,
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

    this.afterSave(saveData, data);
  }

  showStatusPage (response) {
    this.editDialog.showStatusPage(response);
  }

  hideStatusPage () {
    this.editDialog.hideStatusPage();
  }

  close () {
    this.editDialog.close();
  }

  async beforeLoad (data) {
    return;
  }

  afterLoad (data) {
    return;
  }

  beforeSave (saveData, data) {
    return;
  }

  afterSave (saveData, data) {
    return;
  }

  _getValue (binding, relAttribute, data) {
    let value;

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
            value = relAttribute ? data.relationships[binding].element[relAttribute] : data.relationships[binding].element[binding]
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
      case 'paper-input':
      default:
        elem.value = value;
        break;
    }
  }
}