import { LitElement, html, css } from 'lit';


class CasperEditDialogWarning extends LitElement {
  static properties = {
    _title: {
      type: String
    },
    _message: {
      type: String
    },
    _type: {
      type: String
    },
    _accept: {
      type: String
    },
    _reject: {
      type: String
    },
  };

  static styles = css`
    .ced-warning {
      width: 400px;
      max-width: 90vw;
      max-height: 90vh;
      background-color: #FFF;
      box-shadow: rgba(0, 0, 0, 15%) 0 5px 20px;
      border: none;
      padding: 20px;
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .ced-warning::backdrop {
      background-color: rgba(204, 204, 204, 65%);
    }

    .ced-warning__text {
      margin: 0 10px 2rem 10px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .ced-warning__title {
      font-size: 1.125rem;
      margin: 0;
      color: #000;
    }

    .ced-warning__message {
      font-size: 1rem;
      margin: 0;
      color: rgb(68, 68, 68);
    }

    .ced-warning__actions {
      display: flex;
      gap: 5px;
      justify-content: flex-end;
    }

    .edit-dialog__button {
      color: #FFF;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.714em;
      border-radius: 1.428em;
      outline: none;

      min-width: 60px;
      cursor: pointer;
    }

    .ced-warning[type="regular"] .edit-dialog__button {
      background-color: var(--button-primary-color);
      border: 2px solid var(--button-primary-color);
    }

    .ced-warning[type="warning"] .edit-dialog__button {
      background-color: var(--error-color-soft);
      border: 2px solid var(--error-color-soft);
    }

    .ced-warning[type="warning"] .edit-dialog__button:hover {
      background-color: var(--error-color-soft-hover);
      border: 2px solid var(--error-color-soft-hover);
    }

    .ced-warning[type] .edit-dialog__button.reverse,
    .ced-warning[type] .edit-dialog__button.reverse:hover {
      background-color: #FFF;
    }

    .ced-warning[type="regular"] .edit-dialog__button.reverse {
      color: var(--button-primary-color);
    }

    .ced-warning[type="warning"] .edit-dialog__button.reverse {
      color: var(--error-color-soft);
    }

    .ced-warning[type="warning"] .edit-dialog__button.reverse:hover {
      color: var(--error-color-soft-hover);
    }

    .edit-dialog__button[disabled] {
      color: #FFF;
      background-color: #e0e0e0;
      border: 2px solid #e0e0e0;
      pointer-events: none;
    }
  `;

  
  constructor () {
    super();

    this._type = 'regular';
    this._title = '';
    this._message = '';
    this._accept = 'Sim';
    this._reject = 'Cancelar';
  }

  render () {
    return html`
      <dialog id="editDialogWarning" class="ced-warning" type=${this._type}>
        <div class="ced-warning__text">
          <h1 class="ced-warning__title">${this._title}</h1>
          <p class="ced-warning__message">${this._message}</p>
        </div>
    
        <div class="ced-warning__actions">
          <button class="edit-dialog__button reverse" @click=${this.close.bind(this)}>${this._reject}</button>
          <button class="edit-dialog__button" @click=${this.confirm.bind(this)}>${this._accept}</button>
        </div>
      </dialog>
    `;
  }

  firstUpdated () {
    this._warningEl = this.shadowRoot.getElementById('editDialogWarning');
  }

  open (options) {
    this._options = options;
    if (this._options.type) this._type = this._options.type;
    if (this._options.title) this._title = this._options.title;
    if (this._options.message) this._message = this._options.message;
    if (this._options.accept) this._accept = this._options.accept;
    if (this._options.reject) this._reject = this._options.reject;

    this._warningEl.showModal();
  }

  close () {
    this._warningEl.close();
  }

  confirm () {
    this.close();

    if (this._options.hasOwnProperty('accept_callback')) this._options.accept_callback();
  }
}

customElements.define('casper-edit-dialog-warning', CasperEditDialogWarning);