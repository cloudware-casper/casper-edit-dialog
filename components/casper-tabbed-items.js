import { LitElement, html, css } from 'lit';
import {classMap} from 'lit-html/directives/class-map.js';
import '@cloudware-casper/casper-icons/casper-icon.js';


class CasperTabbedItems extends LitElement {
  static properties = {
    renderItem: {
      type: Function
    },
    items: {
      type: Array
    },
    relationships: {
      type: Array
    },
    showNewItemsAction: {
      type: Boolean
    },
    allowNewItems: {
      type: Boolean
    },
    showDeleteItemsAction: {
      type: Boolean
    },
    _activeIndex: {
      type: Number
    }
  };

  static styles = css`
    :host {
      --grid-item-min-width: 14.4rem;
      --cti-grey: rgb(179, 179, 179);
      --cti-dark-grey: rgb(149, 149, 149);
      --tab-vertical-padding: 0.25rem;
      --header-before-height: 0;
    }

    button {
      font-family: inherit;
      border: none;
      cursor: pointer;
      background-color: transparent;
    }

    button[hidden] {
      display: none !important;
    }

    .tabbed-items__action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--tab-vertical-padding);
    }

    .tabbed-items__action casper-icon {
      font-size: 1rem;
      width: 1em;
      height: 1em;
    }

    .tabbed-items__action[disabled] {
      pointer-events: none !important;
      background-color: var(--disabled-background-color) !important;
      color: var(--disabled-text-color) !important;
    }

    .header {
      --header-padding-bottom: 0.5rem;
      --header-background-color: #FFF;

      display: flex;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid rgb(217, 217, 217);
      position: sticky;
      top: 0;
      background-color: var(--header-background-color);
      z-index: 1;
    }

    /* Prevents elements from peeking through while scrolling */
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: var(--header-before-height);
      transform: translateY(-100%);
      background-color: inherit;
    }

    .header__tabs-wrapper {
      overflow: scroll;
      scroll-behavior: smooth;
      -ms-overflow-style: none;  /* Hides scrollbar for IE and Edge */
      scrollbar-width: none;  /* Hides scrollbar for Firefox */
      display: flex;
      padding-bottom: var(--header-padding-bottom);
      /* Trick to fix bug where 1px of a not yet scrolled into view item would be visible */
      clip-path: inset(0px 1px 0px 1px);
    }

    /* Hides scrollbar for Chrome, Safari and Opera */
    .header__tabs-wrapper::-webkit-scrollbar {
      display: none;
    }

    /* Shadows which indicate the wrapper is scrollable */
    .header__tabs-wrapper::before,
    .header__tabs-wrapper::after {
      --width: 60px;

      content: ' ';
      position: sticky;
      width: var(--width);
      margin-left: calc(var(--width) * -1);
      margin-bottom: calc(var(--header-padding-bottom) * -1);
      pointer-events: none;
      flex-shrink: 0;
      /* Necessary to stay above the tabs */
      z-index: 2;
      opacity: 0;
      transition: opacity .3s ease-out;
    }

    .header__tabs-wrapper::before {
      left: 0;
      background: linear-gradient(90deg, var(--header-background-color) 5px, transparent);
    }

    .header__tabs-wrapper::after {
      right: 0;
      background: linear-gradient(270deg, var(--header-background-color) 5px, transparent);
    }

    .header__tabs-wrapper.shadow-left::before,
    .header__tabs-wrapper.shadow-right::after {
      opacity: 1;
    }

    .header__tab {
      position: relative;
      font-size: 0.875rem;
      font-weight: 500;
      padding: var(--tab-vertical-padding) 0.875rem;
      background-color: transparent;
      color: var(--cti-grey);
      transition: color 0.5s ease;
    }

    .header__tab:not(:last-of-type) {
      margin-right: 0.375rem;
    }

    .header__tab:hover {
      color: var(--cti-dark-grey);
    }

    .header__tab::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: calc(var(--header-padding-bottom) * -1);
      width: 0;
      height: 2.5px;
      transform: translate(-50%, 0%);
      z-index: 1;
      background-color: transparent;
      transition: background-color 0.5s ease, width 0.5s ease;
    }

    .header__tab[active] {
      pointer-events: none;
      color: var(--primary-color);
      font-weight: 600;
    }

    .header__tab[active]::after {
      background-color: var(--primary-color);
      width: 100%;
    }

    .header__tab-text {
      display: block;
      white-space: nowrap;
      max-width: 9.375rem;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .header__add {
      background-color: var(--light-primary-color);
      color: var(--primary-color);
      border-radius: 50%;
      transition: background-color 0.5s ease;
      margin-bottom: var(--header-padding-bottom);
    }

    .header__add:hover {
      background-color: rgba(var(--dark-primary-color-rgb), 0.2);
    }

    .content {
      --item-padding: 0.625rem;

      position: relative;
    }

    .content__item {
      display: none;
      grid-row-gap: 0.625rem;
      grid-column-gap: 1.25rem;
      grid-template-columns: repeat(auto-fit, minmax(var(--grid-item-min-width), 1fr));
      grid-auto-rows: minmax(min-content, max-content);
      align-content: start;
      padding: var(--item-padding);
      /* Space needed so that an input's error message fits */
      padding-bottom: 3rem;
      border-bottom: 1px solid rgb(217, 217, 217);
    }

    .content__item[active] {
      display: grid;
    }

    .content__delete {
      position: absolute;
      right: var(--item-padding);
      bottom: var(--item-padding);
      border-radius: 3px;
      gap: 0.3125rem;
      background-color: transparent;
      color: var(--status-red);
      transition: color 0.5s ease, background-color 0.5s ease;
      padding: 0;
    }

    .content__delete:hover {
      color: var(--error-color);
    }
  `;

  constructor () {
    super();

    this.items = [];
    this.showNewItemsAction = true;
    this.allowNewItems = true;
    this.showDeleteItemsAction = true;
    this._activeIndex = 0;
    this._tabsWrapperClasses = { 'shadow-left': false, 'shadow-right': false };
    this._relType = '';
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.addNewItem) this.allowNewItems = false;
  }

  render () {
    return html`
      <div class="header">
        ${(this.items.length > 0)
          ? html`
            <div class="header__tabs-wrapper ${classMap(this._tabsWrapperClasses)}" @click=${this._findScrollDirection}>
              ${this.items.map((item, index) => html`
                <button class="header__tab" ?active=${index === this._activeIndex} .index=${index} name="tab-${index}" @click=${this.activateItem.bind(this, index)}>
                  <span class="header__tab-text">${item.title ? item.title : index + 1}</span>
                </button>
              `)}
            </div>`
          : ''
        }

        ${this.showNewItemsAction
          ? html`
            <button class="header__add tabbed-items__action" @click=${this._addNewItem} ?disabled=${!this.allowNewItems}>
              <casper-icon icon="fa-regular/plus"></casper-icon>
            </button>`
          : ''
        }
      </div>

      <div class="content">
        ${(this.items.length > 0)
          ? this.items.map((item, index) => this._renderItem(item, index))
          : ''
        }

        ${this.showDeleteItemsAction 
          ? html`
            <button class="content__delete tabbed-items__action" @click=${this._deleteItem} ?disabled=${!this.items?.[this._activeIndex]?.allow_delete} ?hidden=${!this.items?.[this._activeIndex]?.hasOwnProperty('allow_delete')}>
              <casper-icon icon="fa-regular/trash-alt"></casper-icon>
              Eliminar
            </button>` 
          : ''
        }
      </div>
    `;
  }

  firstUpdated () {
    this._headerEl = this.shadowRoot.querySelector('.header');
    this._contentEl = this.shadowRoot.querySelector('.content');
  }

  updated (changedProperties) {
    if (!this._tabsWrapperEl && this.items?.length > 0) this._tabsWrapperEl = this.shadowRoot.querySelector('.header__tabs-wrapper');

    if (this._tabsWrapperEl && changedProperties.has('items')) {
      if (changedProperties.get('items')?.length > 0) {
        // When a new item is added, we scroll the corresponding tab into view
        const scrollWidth = this._tabsWrapperEl.scrollWidth;
        const clientWidth = this._tabsWrapperEl.clientWidth;

        if (scrollWidth > clientWidth) this.scrollTabsWrapper('right', scrollWidth - clientWidth);
      }

      if (!this._tabsWrapperIntersectionObserver) {
        this._tabsWrapperIntersectionObserver = new IntersectionObserver(this._handleTabsWrapperIntersection.bind(this), {
          root: this._tabsWrapperEl,
          rootMargin: '0px',
          threshold: 0.99
        }); 
      }

      // First we stop observing all items
      this._tabsWrapperIntersectionObserver.disconnect();

      const tabs = this._tabsWrapperEl.querySelectorAll('.header__tab');

      if (tabs.length <= 1) {
        this._tabsWrapperClasses['shadow-left'] = false;
        this._tabsWrapperClasses['shadow-right'] = false;
        this.requestUpdate();
      } else {
        const firstTab = tabs[0];
        const lastTab = tabs[tabs.length - 1];

        firstTab.setAttribute('position', 'left');
        lastTab.setAttribute('position', 'right');

        this._tabsWrapperIntersectionObserver.observe(firstTab);
        this._tabsWrapperIntersectionObserver.observe(lastTab);
      }
    }

    if (changedProperties.has('relationships')) { 
      this._loadFromResource();
    }
  }



  //***************************************************************************************//
  //                              ~~~ Public methods  ~~~                                  //
  //***************************************************************************************//

  activateItem (newIndex) {
    if (+newIndex === +this._activeIndex) return;

    this._activeIndex = +newIndex;
  }

  /**
   * The method implemented by the developer must receive an index argument of the item to be deleted.
   * The item with the given index must be removed from the items array. 
   * No changes must be made to the DOM or other internal properties, since this will be handled by Lit.
   */
  addNewItem () {
    console.warn('A addNewItem method must be defined for the component.');
  }

  shouldAllowDelete () {
    return true;
  }

  /**
   * This method is responsible for scrolling the tabs wrapper.
   *
   * @param {String} direction The direction of the scroll.
   * @param {Number} value The value of the scroll.
   */
  scrollTabsWrapper (direction, value) {
    if (direction === 'right') {
      this._tabsWrapperEl.scrollLeft += value;
    } else if (direction === 'left') {
      this._tabsWrapperEl.scrollLeft -= value;
    }
  }

  getSaveData (foreignKey) {
    let saveData = {post:{},patch:{},delete:{}};

    ['patch', 'post', 'delete'].forEach((request) => {
      if (!saveData[request][this._relType]) {
        saveData[request][this._relType] = {
          payloads: [{
            relationship: this._relType,
            urn: null
          }]
        }
      }

      if (request != 'delete') {
        saveData[request][this._relType]['payloads'][0]['payload'] = {
          data: {
            type: this._relType,
            attributes: {}
          }
        }
      }

      if (request == 'patch') {
        saveData[request][this._relType]['payloads'][0]['payload']['data']['id'] = null;
      }
    });


    if (this.relationships?.data?.length) {
      // if there's data, there are elements in the structure with the default values
      // loop elements and find their respective tab via data-id
      // if tab is missing, it must've been deleted and should be added to the 'delete' saveData
      this.relationships.elements.forEach((item, index) => {
        const tab = this._contentEl.querySelector(`.content__item[item-id="${item.id}"]`);

        if (tab) {
          const attributesPatch = {};

          for (const elem of tab.querySelectorAll('[binding]')) {
            const binding = elem.getAttribute('binding');

            switch (elem.tagName.toLowerCase()) {
              case 'casper-select':
                // TODO: multiselect
                if (elem.value != item[binding]) {
                  const options = [];
                  const values = elem.value.split(',');

                  // debugger;
                  // values.forEach((v, i) => {
                  //   const option = this._contactCategories.find(c => c.id == v)?.name;

                  //   if (option) {
                  //     options.push(option);
                  //   }
                  // });

                  // attributesPatch[binding] = options;
                }
                break;
              case 'paper-checkbox':
                if (elem.checked != item[binding]) {
                  attributesPatch[binding] = elem.checked;
                }
                break;
              case 'paper-input':
              default:
                if (item[binding]) {
                  if (elem.value != item[binding]) {
                    attributesPatch[binding] = elem.value;
                  }
                } else if (item.relationships[binding]) {
                  if (elem.value != item.relationships[binding].data.id) {
                    attributesPatch[binding] = elem.value;
                  }
                }

                break;
            }
          }

          if (Object.entries(attributesPatch)) {
            if (!saveData.patch[this._relType].payloads[index]) {
              saveData.patch[this._relType].payloads[index] = {
                urn: `${this._relType}/${this.relationships.data[index].id}`,
                payload: {
                  data: {
                    type: this._relType,
                    id: this.relationships.data[index].id,
                    attributes: attributesPatch
                  }
                }
              }
            } else {
              saveData.patch[this._relType].payloads[index].urn = `${this._relType}/${this.relationships.data[index].id}`;
              saveData.patch[this._relType].payloads[index].payload.data.id = this.relationships.data[index].id;
              saveData.patch[this._relType].payloads[index].payload.data.attributes = attributesPatch;
            }
          }
        } else {
          // data missing, must've been deleted
          saveData.delete[this._relType].payloads[index] = { urn: `${this._relType}/${this.relationships.data[index].id}` };
        }
      });

      const newTabs = this._contentEl.querySelectorAll('.content__item[item-id=""]');

      if (newTabs && newTabs.length) {
        newTabs.forEach((newItem, index) => {
          const attributesPost = {};
          attributesPost[foreignKey.type] = foreignKey.typeValue;
          attributesPost[foreignKey.idField] = foreignKey.id;

          for (const elem of newItem.querySelectorAll('[binding]')) {
            const binding = elem.getAttribute('binding');

            switch (elem.tagName.toLowerCase()) {
              case 'paper-checkbox':
                attributesPost[binding] = elem.checked;
                break;
              case 'paper-input':
              default:
                attributesPost[binding] = elem.value;
                break;
            }
          }

          if (Object.entries(attributesPost)) {
            if (!saveData.post[this._relType].payloads[index]) {
              saveData.post[this._relType].payloads[index] = {
                urn: this._relType,
                payload: {
                  data: {
                    type: this._relType,
                    attributes: attributesPost
                  }
                }
              }
            } else {
              saveData.post[this._relType].payloads[index].urn = this._relType;
              saveData.post[this._relType].payloads[index].payload.data.attributes = attributesPost;
            }
          }
        });
      }
    }

    return saveData;
  }


  //***************************************************************************************//
  //                              ~~~ Private methods  ~~~                                 //
  //***************************************************************************************//

  _renderItem (item, index) {
    return html`
      <div class="content__item" item-id=${item.id ? item.id : ''} ?active=${+index === +this._activeIndex}>
        ${this.renderItem(item)}
      </div>
    `;
  }

  _addNewItem () {
    this.items = [...this.items, this.addNewItem()];
    this.activateItem(this.items.length-1);
    this.requestUpdate();
  }

  _deleteItem () {
    this.items.splice(this._activeIndex, 1)
    if (this._activeIndex > 0) this.activateItem(this._activeIndex - 1);
    this.requestUpdate();
  }

  async _loadFromResource () {
    let tabs = [];
    
    if (this.relationships?.data?.length) {
      // Set relationship elements
      if (!this.relationships.elements) {
        this.relationships.elements = [];
      }      

      let items = [];
      this._relType = this.relationships?.data?.[0]?.type;
      const idString = String(this.relationships.data.map(item => item.id));

      if (idString && this._relType) {
        const response = await app.broker.get(`${this._relType}?filter="id IN (${idString})"`, 10000);
        this.relationships.elements = response.data;
        items = response.data.map((element,index) => {
          return {
            id: element.id,
            title: element.name,
            values: element,
            allow_delete: this.shouldAllowDelete(index)
          };
        });
      }

      tabs.push(...items);
    }

    this._setTabbedItems(tabs);
  }

  _setTabbedItems (data) {
    const items = data.map((item, index) => {
      const newTab = {
        id: item.id || null,
        title: item.title,
        values: item.values || null,
      }
      if (item.allow_delete) newTab.allow_delete = item.allow_delete;
      return newTab;
    });

    this.items = [...this.items, ...items];
  }

  /**
   * Event listener that fires when the user clicks on the tabs wrapper. 
   * It is responsible for finding whether the tabs wrapper should be scrolled left or right.
   *
   * @param {Object} event The event's object.
   */
  _findScrollDirection (event) { 
    if (!event) return;
    
    // Here there's no need to scroll
    if (this._tabsWrapperEl.offsetWidth >= this._tabsWrapperEl.scrollWidth) return;

    const currentTab = this._tabsWrapperEl.querySelector('.header__tab[active]');
    const middleX = this._tabsWrapperEl.offsetWidth / 2;
    const clickX = event.clientX - this._tabsWrapperEl.getBoundingClientRect().left;

    let direction;
    if (clickX >= middleX) {
      direction = 'right';
    } else if (clickX < middleX) {
      direction = 'left';
    }
    
    const scrollValue = currentTab.offsetWidth;
    this.scrollTabsWrapper(direction, scrollValue);
  }

  /**
   * Intersection observer responsible for adding/removing the scroll cues/shadows.
   *
   * @param {Object} entries The list of entries. Each entry describes an intersection change for one observed target element.
   */
  _handleTabsWrapperIntersection (entries) {
    entries.forEach(entry => {
      const target = entry.target;
      
      if (target.classList.contains('header__tab') && target.hasAttribute('position')) {
        const position = target.getAttribute('position');
        const root = this._tabsWrapperEl;

        if (entry.isIntersecting || root.clientWidth === 0 || !target.parentElement) {
          this._tabsWrapperClasses[`shadow-${position}`] = false;
        } else {
          this._tabsWrapperClasses[`shadow-${position}`] = true;
        }

        this.requestUpdate();
      }
    });
  }
}

customElements.define('casper-tabbed-items', CasperTabbedItems);