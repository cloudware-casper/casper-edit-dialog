import { LitElement, html, css } from 'lit';


class CasperButtonLit extends LitElement {
  static properties = {
    text: {
      type: String
    }
  };

  static styles = css`
    :host {
      --button-font-size: 0.75rem;
    }

    .button {
      font-family: inherit;
      color: #FFF;
      font-size: var(--button-font-size);
      font-weight: 600;
      padding: 0.714em 1em;
      min-width: 4.5em;
      border-radius: 1.428em;
      outline: none;
      text-transform: uppercase;
      border: 1.5px solid;
      cursor: pointer;
    }

     .button[theme="regular"] {
      background-color: var(--button-primary-color);
      border-color: var(--button-primary-color);
    }

    .button[theme="regular"]:hover {
      background-color: var(--light-primary-color);
      color: var(--button-primary-color);
    }

    .button[theme="warning"] {
      background-color: var(--error-color-soft);
      border-color: var(--error-color-soft);
    }

    .button[theme="warning"]:hover {
      background-color: var(--error-color-soft-hover);
      border-color: var(--error-color-soft-hover);
    }

    .button[theme][type="secondary"],
    .button[theme][type="secondary"]:hover {
      background-color: transparent;
    }

    .button[theme="regular"][type="secondary"] {
      color: var(--button-primary-color);
    }

    .button[theme="warning"][type="secondary"] {
      color: #808080;
      border-color: #a9a9a9;
    }

    .button[theme="warning"][type="secondary"]:hover {
      color: #707070;
      border-color: #808080;
    }

    :host([disabled]) {
      pointer-events: none !important;
    }

    :host([disabled]) .button {
      color: #FFF !important;
      background-color: #e0e0e0 !important;
      border-color: #e0e0e0 !important;
    }
  `;

  constructor () {
    super();

    this._theme = 'regular';
    this._type = 'primary';
    this.text = '';
  }

  render () {
    return html`
      <button class="button" type=${this._type} theme=${this._theme}>
        ${this.text}
      </button>
    `;
  }

  firstUpdated () {
    this._buttonEl = this.shadowRoot.querySelector('.button');
  }
}

customElements.define('casper-button-lit', CasperButtonLit);