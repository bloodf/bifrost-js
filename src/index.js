/* eslint-disable no-underscore-dangle */
import { required, logError, addSpaces } from './helpers';
import BifrostWebSocket from './webSocket';

/**
 * Show the error on not connected PinPad
 */
function notConnected() {
  throw new Error('PinPad não foi inicializado. Por favor, inicie o PinPad antes de executar outro comando.');
}

/**
 * @class PagarMeTEF
 * @constructor PagarMeConstructor
 */
class PagarMeBifrost {
  /**
   * Class Constructor
   * @param {Object.<PagarMeConstructor>} params
   */
  /**
   * @typedef {Object} PagarMeConstructor
   * @property {boolean} debug
   * @property {string} host
   * @property {string} contextId
   * @property {number} baudRate
   * @property {string} encryptionKey
   * @property {number} pinPadMaxCharLine
   * @property {number} pinPadMaxChar
   * @property {number} pinPanDisplayLines
   */
  constructor(params) {
    try {
      this.baudRate = params.baudRate || 115200;
      this.contextId = required('contextId', params.contextId);
      this.encryptionKey = required('encryptionKey', params.encryptionKey);
      this.pinPadMaxCharLine = params.pinPadMaxCharLine || 16;
      this.pinPadMaxChar = params.pinPadMaxChar || 32;
      this.pinPanDisplayLines = params.pinPanDisplayLines || 2;

      const constructorOptions = {
        debug: params.debug || false,
        contextId: this.contextId,
        host: params.host || 'wss://localhost:2000/mpos',
      };

      this.__bifrost__ = new BifrostWebSocket(constructorOptions);
    } catch (error) {
      logError(error, true);
    }
  }

  get connected() {
    return this.__bifrost__.connected;
  }

  /**
   * Initialize the PinPad
   * @returns {Promise<boolean>}
   */
  async initialize() {
    try {
      await this.__bifrost__.getPinPadDevices();
      await this.__bifrost__.initialize({ encryptionKey: this.encryptionKey });
      return Promise.resolve(true);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Terminate the PinPad
   * @returns {Promise<Boolean>}
   */
  async terminate() {
    try {
      if (!this.connected) notConnected();
      await this.__bifrost__.closePinPadContext();
      return Promise.resolve(true);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the PinPad Status
   * @returns {Promise<Object.<BifrostServiceStatus>>}
   */
  async status() {
    try {
      if (!this.connected) notConnected();
      return this.__bifrost__.getPinPanStatus();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Display a message on the PinPad
   * @param {string|array} message - A message string or an array of messages.
   * @returns {Promise<String>}
   */
  async showMessage(message) {
    try {
      if (!this.connected) notConnected();
      const tefMaxCharLine = this.pinPadMaxCharLine;
      const tefMaxChar = this.pinPadMaxChar;
      let formattedMessage = '';

      if (Array.isArray(message)) {
        formattedMessage = message
          .slice(0, this.pinPanDisplayLines)
          .map(m => addSpaces(m, tefMaxCharLine))
          .join('');
      }

      if (typeof message === 'string') {
        formattedMessage = addSpaces(message, tefMaxChar);
      }

      await this.__bifrost__.displayMessageOnPinPadScreen(formattedMessage);
      return Promise.resolve(formattedMessage);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Start the payment process
   * @param {number} amount
   * @param {string|number} method = 'credit'|'debit'|1|2
   * @returns {Promise<Object.<PinPadProcessedCardReturn>>}
   */
  async payment(amount, method) {
    try {
      if (!this.connected) notConnected();
      this.__bifrost__.startPayment({ amount, method });
      const processedPayment = await this.__bifrost__.startPaymentProcess();

      return Promise.resolve(processedPayment);
    } catch (error) {
      logError(error);
      await this.showMessage(error.text);
      setTimeout(async () => {
        await this.finish();
        await this.terminate();
        setTimeout(async () => {
          await this.initialize();
        }, 2000);
      }, 2000);
      return Promise.reject(error);
    }
  }

  /**
   * @typedef {object} PinPadFinishParameters
   * @property {number} timeout - Timeout in MS between the execution of messages
   * @property {string|array} messages - An string or an Array of messages
   * @property {string} code
   * @property {string} emvData
   */
  /**
   * Finish the PinPad payment process.
   * @param {PinPadFinishParameters} params
   * @returns {Promise<*>}
   */
  async finish(params = {}) {
    try {
      if (!this.connected) notConnected();
      const code = params.code || '';
      const emvData = params.emvData || '';
      const timeOut = params.timeout || 2000;
      const messages = params.messages || null;
      const processed = await this.__bifrost__.finishPaymentProcess(code, emvData);

      if (Array.isArray(messages)) {
        messages.forEach((message, index) => {
          setTimeout(async () => {
            await this.showMessage(message);
          }, timeOut * (index + 1));
        });
      }

      if (typeof messages === 'string') {
        setTimeout(async () => {
          await this.showMessage(messages);
        }, timeOut);
      }

      return Promise.resolve(processed);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export default PagarMeBifrost;
