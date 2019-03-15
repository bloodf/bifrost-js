/* eslint-disable no-underscore-dangle */
import WebSocketAsPromised from 'websocket-as-promised';
import { required, logError, logInfo } from './helpers';

class BifrostWebSocket {
  constructor({ contextId, baudRate, debug, host }) {
    this.debug = debug || false;
    this.contextId = required('contextId', contextId);
    this.baudRate = baudRate || 115200;
    this._connected = false;
    this.devices = [];
    this._host = host || 'wss://localhost:2000/mpos';
    this.ws = new WebSocketAsPromised(this._host, {
      packMessage: data => JSON.stringify(data),
      unpackMessage: message => JSON.parse(message),
      attachRequestId: (data, requestId) => Object.assign({ request_type: requestId }, data),
      extractRequestId: data => data && data.response_type,
    });
    this._amount = 0;
    this._method = '';
    this._wsConnected = false;
    this.lastRequest = null;
    this.__response = {
      unknownCommand: 0,
      devicesListed: 1,
      initialized: 2,
      alreadyInitialized: 3,
      processed: 4,
      finished: 5,
      messageDisplayed: 6,
      status: 7,
      contextClosed: 8,
      error: 9,
    };
    this.__request = {
      listDevices: 1,
      initialize: 2,
      process: 4,
      finish: 5,
      displayMessage: 6,
      status: 7,
      closeContext: 8,
    };
    this.__errorContextString = 'Device already in use by context ';
    this.__errorInitialize = 'An error has occured with the [Initialize] request. See the log and contact the support.';
    this.__errorOperationErrored = 'Transaction Errored';
    this.__errorOperationFailed = 'Error: 43';
    this.__errorOperationCanceled = 'Transaction Canceled';
    this.__catastroficError = 'Error: 14';
    this.__paymentMethods = {
      credit: 1,
      debit: 2,
    };
  }

  debugLog(message) {
    if (this.debug) {
      logInfo(message);
    }
  }

  classError(message) {
    this.debugLog((typeof message === 'object') ? message.text : message);
    throw new Error(message);
  }

  get amount() {
    return this._amount; // eslint-disable-line
  }

  get connected() {
    return (this._connected && this._wsConnected);
  }

  set amount(value) {
    if (typeof value === 'number' && value <= 0) {
      throw new Error('Não é possível definir um valor menor ou igual a zero.');
    } else {
      this._amount = parseFloat(value) * 100;
    }
  }

  get method() {
    return this._method;
  }

  set method(value) {
    if (typeof value === 'string') {
      if (Object.keys(this.__paymentMethods)
        .includes(value)) {
        this._method = value;
      }
    } else if (typeof value === 'number') {
      if (this.__paymentMethods.find(p => p === value)) {
        this._method = Object.keys(this.__paymentMethods)
          .find(k => this.__paymentMethods[k] === value);
      }
    } else {
      throw new Error('Método de pagamento não permitido.');
    }
  }

  defineRequest(value) {
    if (value === undefined) this.lastRequest = null;
    if (this.lastRequest !== null) {
      this.classError('Não é possível fazer requisições asíncronas, termine uma ação antes de executar a outra.');
    }

    if (typeof value === 'number') this.lastRequest = value;
  }

  /**
   * Start the connection to the Bifrost WebSocket
   * @returns {Promise<boolean>}
   */
  async startWsConnection() {
    try {
      this.debugLog('Abrindo conexão com o WebSocket.');
      await this.ws.open();
      this._wsConnected = true;
      return true;
    } catch (error) {
      logError(error, true);
      return false;
    }
  }

  /**
   * Terminate the connection to the Bifrost WebSocket
   * @returns {Promise<void>}
   */
  async closeWsConnection() {
    try {
      this.debugLog('Fechando conexão com o WebSocket.');
      await this.ws.close();
      this._wsConnected = false;
    } catch (error) {
      logError(error, true);
    }
  }

  /**
   * Terminate the context of the PinPad device
   * @param {string} contextId = null - Optional ContextId to be terminated
   * @returns {Promise<*>}
   */
  async closePinPadContext(contextId = this.contextId) {
    try {
      this.debugLog('Fechando contexto do Serviço Bifrost.');
      this.defineRequest(this.__request.closeContext);
      const responseData = await this.ws.sendRequest({
        request_type: this.__request.closeContext,
        context_id: contextId,
      }, { requestId: this.__request.closeContext });
      this._connected = false;
      this.defineRequest();
      return Promise.resolve(responseData);
    } catch (error) {
      this.defineRequest();
      await this.closeWsConnection();
      return Promise.reject(error);
    }
  }

  /**
   * @typedef {object} PinPadDevice
   * @property {string} id - Device ID
   * @property {number} kind - Device Kind
   * @property {string} manufacturer - Device Manufacturer
   * @property {string} name - Device name
   * @property {string} port - Device Port
   */
  /**
   * Get the connected devices on the serial port (COM)
   * @returns {Promise<Array.<PinPadDevice>>}
   */
  async getPinPadDevices() {
    try {
      this.debugLog('Buscando lista de dispositivos do sistema.');
      this.defineRequest(this.__request.listDevices);
      const responseData = await this.ws.sendRequest({
        request_type: this.__request.listDevices,
        context_id: this.contextId,
      }, { requestId: this.__request.listDevices });
      this.debugLog(responseData);
      this.devices = responseData.device_list;
      this.defineRequest();
      return Promise.resolve(this.devices);
    } catch (error) {
      this.defineRequest();
      return Promise.reject(error);
    }
  }

  /**
   * @typedef {object} PinPadInitializerParameters
   * @property{string} encryptionKey
   * @property {number} simpleInitialize = null
   * @property {number} timeoutMilliseconds = null
   */
  /**
   * Start the PinPan hardware
   * @param {PinPadInitializerParameters} params
   * @param {number} deviceIndex = 0 - Index of the device in the devices Array.
   */
  async initialize(params, deviceIndex = 0) {
    try {
      if (!this._wsConnected) await this.startWsConnection();
      this.debugLog(`Conectando ao PinPad ${this.devices[deviceIndex].id}.`);
      this.defineRequest(this.__request.initialize);
      this.ws.sendPacked({
        request_type: this.__request.initialize,
        context_id: this.contextId,
        initialize: {
          device_id: this.devices[deviceIndex].id,
          encryption_key: params.encryptionKey,
          baud_rate: this.baudRate,
          simple_initialize: params.simpleInitialize,
          timeout_milliseconds: params.timeoutMilliseconds,
        },
      });
      this.ws.onMessage.addListener(async (message) => {
        if (this.lastRequest === this.__request.initialize) {
          this.defineRequest();
          const response = JSON.parse(message);
          if (response.response_type === this.__response.initialized) {
            this._connected = true;
            this.ws.removeAllListeners();
            return this.debugLog(`PinPad ${this.devices[deviceIndex].id} inicializado com sucesso.`);
          }

          if (response.response_type === this.__response.alreadyInitialized) {
            this.debugLog('Serviço Bifrost já inicializado, reiniciando a conexão.');
            this.ws.removeAllListeners();
            await this.closePinPadContext(response.context_id);
            await this.initialize({
              encryptionKey: params.encryptionKey,
              baud_rate: this.baudRate,
              simpleInitialize: params.simpleInitialize,
              timeoutMilliseconds: params.timeoutMilliseconds,
            }, 0);
            return false;
          }

          if (response.response_type === this.__response.error && this.__errorInitialize) {
            const nextDevice = (deviceIndex + 1);

            if (nextDevice > this.devices.length) {
              await this.closeWsConnection();
              this.classError('Não foi possível inicial a conexão com nenhum dispositivo.');
            } else {
              this.debugLog('Dispositivo selecionado não é válido, inicializando novamente com próximo dispositivo da lista.');
              this.ws.removeAllListeners();
              await this.initialize({
                encryptionKey: params.encryptionKey,
                baud_rate: this.baudRate,
                simpleInitialize: params.simpleInitialize,
                timeoutMilliseconds: params.timeoutMilliseconds,
              }, nextDevice);
              return false;
            }
          }

          if (response.error === this.__catastroficError) {
            this.classError('Erro catastrófico no sistema. Por favor, reinicialize o PinPad e o Serviço do Bifrost');
            this.ws.removeAllListeners();
            return false;
          }

          if (response.error && response.error.includes(this.__errorContextString)) {
            this.debugLog('Serviço Bifrost com contexto diferente do definido na classe.');
            this.ws.removeAllListeners();
            const context = response.error.split(this.__errorContextString)[1];
            if (await this.closePinPadContext(context)) {
              await this.initialize({
                encryptionKey: params.encryptionKey,
                baud_rate: this.baudRate,
                simpleInitialize: params.simpleInitialize,
                timeoutMilliseconds: params.timeoutMilliseconds,
              }, 0);
            }

            return false;
          }
        }

        return message;
      });
      return true;
    } catch (error) {
      this.defineRequest();
      return Promise.reject(error);
    }
  }

  /**
   * @typedef {object} BifrostServiceStatus
   * @property {boolean} connected - Is device connected
   * @property {string} contextId - Device Context
   * @property {string} connectedDeviceId - Connected Device Id
   */
  /**
   * Get the Bifrost Service Status
   * @returns {Promise<BifrostServiceStatus>}
   */
  async getPinPanStatus() {
    try {
      this.debugLog('Buscando status do serviço Bifrost.');
      this.defineRequest(this.__request.status);
      const responseData = await this.ws.sendRequest({
        request_type: this.__request.status,
        context_id: this.contextId,
      }, { requestId: this.__response.status });
      logInfo(responseData);
      return Promise.resolve({
        connected: !!responseData.status.code,
        contextId: responseData.context_id,
        connectedDeviceId: responseData.status.connected_device_id,
      });
    } catch (error) {
      this.defineRequest();
      return Promise.reject(error);
    }
  }

  /**
   * Display a message on the PinPad Device
   * @param message
   * @returns {Promise<*>}
   */
  async displayMessageOnPinPadScreen(message) {
    try {
      this.debugLog(`Mostrando "${message}" no display do PinPad.`);
      this.defineRequest(this.__request.displayMessage);
      const responseData = await this.ws.sendRequest({
        request_type: this.__request.displayMessage,
        context_id: this.contextId,
        display_message: {
          message,
        },
      }, { requestId: this.__response.messageDisplayed });
      this.defineRequest();
      return Promise.resolve(responseData);
    } catch (error) {
      this.defineRequest();
      return Promise.reject(error);
    }
  }

  /**
   * @typedef {object} PaymentStartObject
   * @property {number} amount
   * @property {string} method = 'credit'|'debit'
   */
  /**
   * Start the payment process by setting the amount and method.
   * @param {PaymentStartObject} params
   */
  startPayment(params) {
    try {
      this.amount = params.amount;
      this.method = params.method || this.__paymentMethods.credit;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * @typedef {object} PinPadProcessedCardReturn
   * @property {string} card_hash
   * @property {string} card_holder_name
   * @property {number} error_code
   * @property {boolean} is_online_pin
   * @property {number} payment_method
   * @property {number} status
   */
  /**
   * Send the payment request to the PinPad and start the
   * payment process of it.
   * @returns {Promise<Object.<PinPadProcessedCardReturn>>}
   */
  async startPaymentProcess() {
    try {
      return new Promise((resolve, reject) => {
        this.debugLog(`Iniciando processo de pagamento. Venda via ${this.method}, valor ${this.amount / 100}`);
        this.defineRequest(this.__request.process);
        this.ws.sendPacked({
          request_type: this.__request.process,
          context_id: this.contextId,
          process: {
            amount: this.amount,
            magstripe_payment_method: this.method,
          },
        });
        this.ws.onMessage.addListener(async (eventResponse) => {
          if (this.lastRequest === this.__request.process) {
            const response = JSON.parse(eventResponse);
            this.defineRequest();
            if (response.error === this.__errorOperationCanceled) {
              const error = {
                text: 'Operação cancelada pelo usuário.',
                type: 'cardCanceled',
              };
              this.debugLog(error.text);
              this.ws.removeAllListeners();
              return reject(error);
            }

            if (
              response.error === this.__errorOperationErrored
              || response.error === this.__errorOperationFailed
            ) {
              const error = {
                text: 'Aconteceu algum erro na operação, tente novamente.',
                type: 'operationError',
              };
              this.debugLog(error.text);
              this.ws.removeAllListeners();
              return reject(error);
            }

            if (response.response_type === this.__response.processed) {
              this.ws.removeAllListeners();
              return resolve(response.process);
            }
          }

          return eventResponse;
        });
      });
    } catch (error) {
      this.defineRequest();
      return Promise.reject(error);
    }
  }

  /**
   * Finish the payment process of the PinPad
   * @param {string} code
   * @param {string} emvData
   * @returns {Promise<*>}
   */
  async finishPaymentProcess(code, emvData) {
    try {
      this.debugLog(`Finalizando a venda via ${this.method}`);
      this.defineRequest(this.__request.finish);
      const process = await this.ws.sendRequest({
        request_type: this.__request.finish,
        context_id: this.contextId,
        finish: {
          success: !!(code && emvData),
          response_code: code || '0000',
          emv_data: emvData || '000000000.0000',
        },
      }, { requestId: this.__response.finished });
      this.defineRequest();
      return process;
    } catch (error) {
      this.defineRequest();
      return Promise.reject(error);
    }
  }
}

export default BifrostWebSocket;
