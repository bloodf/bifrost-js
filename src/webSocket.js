/* eslint-disable no-underscore-dangle */
import { logInfo, required } from './helpers';

const privateVariables = {
  request: {
    listDevices: 1,
    initialize: 2,
    process: 4,
    finish: 5,
    displayMessage: 6,
    status: 7,
    closeContext: 8,
  },
  response: {
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
  },
  paymentMethods: {
    credit: 1,
    debit: 2,
  },
  errorStrings: {
    errorContextString: 'Device already in use by context ',
    errorInitialize: 'An error has occured with the [Initialize] request. See the log and contact the support.',
    errorOperationErrored: 'Transaction Errored',
    errorOperationFailed: 'Error: 43',
    errorOperationCanceled: 'Transaction Canceled',
    catastroficError: 'Error: 14',
  },
  ws: null,
  timeout: null,
  close: true,
  timeoutConn: null,
};

function _connect(host, payload) {
  if (privateVariables.ws === null) {
    privateVariables.ws = new WebSocket(host);
  } else if (privateVariables.ws.readyState === 2 || privateVariables.ws.readyState === 3) {
    _disconnect();
    privateVariables.ws = new WebSocket(host);
  }

  return new Promise((resolve, reject) => {
    try {
      _timeout();

      const sendRequest = () => {
        _clearTimeout();
        privateVariables.ws.send(JSON.stringify(payload));
        _timeout(60000);
      }

      if (privateVariables.ws.readyState === 0) {
        privateVariables.ws.onopen = () => {
          sendRequest();
        };
      } else if (privateVariables.ws.readyState === 1) {
        sendRequest();
      }

      privateVariables.ws.onmessage = (evtMsg) => {
        _clearTimeout();
        resolve(JSON.parse(evtMsg.data));
      };

      privateVariables.ws.onerror = (evtError) => {
        _clearTimeout();
        if (evtError) reject(evtError);
      };
    } catch (e) {
      reject(e);
    }
  });
}

function _disconnect() {
  privateVariables.ws.close();
  privateVariables.ws = null;
}

function _clearTimeout() {
  privateVariables.close = false;
  clearTimeout(privateVariables.timeoutConn);
}

function _timeout(time = 10000) {
  privateVariables.close = true;
  privateVariables.timeoutConn = setTimeout(() => {
    if (privateVariables.close) {
      privateVariables.ws.close();
    } else {
      _clearTimeout();
    }
  }, time);
}

class BifrostWebSocket {
  constructor({ contextId, baudRate, debug, host }) {
    this.debug = debug || false;
    this.contextId = required('contextId', contextId);
    this.baudRate = baudRate || 115200;
    this._connected = false;
    this.devices = [];
    this._host = host || 'wss://localhost:2000/mpos';
    this._amount = 0;
    this._method = '';
    this.lastRequest = null;
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
    return (this._connected);
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
      if (Object.keys(privateVariables.paymentMethods)
        .includes(value)) {
        this._method = value;
      }
    } else if (typeof value === 'number') {
      if (privateVariables.paymentMethods.find(p => p === value)) {
        this._method = Object.keys(privateVariables.paymentMethods)
          .find(k => privateVariables.paymentMethods[k] === value);
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
   * Terminate the context of the PinPad device
   * @param {string} contextId = null - Optional ContextId to be terminated
   * @returns {Promise<*>}
   */
  async closePinPadContext(contextId) {
    try {

      this.debugLog('Fechando contexto do Serviço Bifrost.');
      this.defineRequest(privateVariables.request.closeContext);
      await _connect(this._host, {
        request_type: privateVariables.request.closeContext,
        context_id: contextId || this.contextId,
      });
      this._connected = false;
      this.defineRequest();
      return Promise.resolve(true);
    } catch (error) {
      this.defineRequest();
      return Promise.reject(error);
    } finally {
      await _disconnect();
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
      this.defineRequest(privateVariables.request.listDevices);
      const responseData = await _connect(this._host, {
        request_type: privateVariables.request.listDevices,
        context_id: this.contextId,
      });
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
      this.debugLog(`Conectando ao PinPad ${this.devices[deviceIndex].id}.`);
      this.defineRequest(privateVariables.request.initialize);
      const response = await _connect(this._host, {
        request_type: privateVariables.request.initialize,
        context_id: this.contextId,
        initialize: {
          device_id: this.devices[deviceIndex].id,
          encryption_key: params.encryptionKey,
          baud_rate: this.baudRate,
          simple_initialize: params.simpleInitialize,
          timeout_milliseconds: params.timeoutMilliseconds,
        },
      });
      if (this.lastRequest === privateVariables.request.initialize) {
        this.defineRequest();
        if (response.response_type === privateVariables.response.initialized) {
          this._connected = true;
          return this.debugLog(`PinPad ${this.devices[deviceIndex].id} inicializado com sucesso.`);
        }

        if (response.response_type === privateVariables.response.alreadyInitialized) {
          this.debugLog('Serviço Bifrost já inicializado, reiniciando a conexão.');
          await this.closePinPadContext(response.context_id);
          await this.initialize({
            encryptionKey: params.encryptionKey,
            baud_rate: this.baudRate,
            simpleInitialize: params.simpleInitialize,
            timeoutMilliseconds: params.timeoutMilliseconds,
          }, 0);
          return false;
        }

        if (response.response_type === privateVariables.response.error && privateVariables.errorStrings.errorInitialize) {
          const nextDevice = (deviceIndex + 1);

          if (nextDevice > this.devices.length) {
            await _disconnect();
            this.classError('Não foi possível inicial a conexão com nenhum dispositivo.');
          } else {
            this.debugLog('Dispositivo selecionado não é válido, inicializando novamente com próximo dispositivo da lista.');
            await this.initialize({
              encryptionKey: params.encryptionKey,
              baud_rate: this.baudRate,
              simpleInitialize: params.simpleInitialize,
              timeoutMilliseconds: params.timeoutMilliseconds,
            }, nextDevice);
            return false;
          }
        }

        if (response.error === privateVariables.errorStrings.catastroficError) {
          this.classError('Erro catastrófico no sistema. Por favor, reinicialize o PinPad e o Serviço do Bifrost');
          _disconnect();
          return false;
        }

        if (response.error && response.error.includes(privateVariables.errorStrings.errorContextString)) {
          this.debugLog('Serviço Bifrost com contexto diferente do definido na classe.');
          const context = response.error.split(privateVariables.errorStrings.errorContextString)[1];
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
      return response;
    } catch (error) {
      return Promise.reject(error);
    } finally {
      this.defineRequest();
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
      this.defineRequest(privateVariables.request.status);
      const responseData = await _connect(this._host, {
        request_type: privateVariables.request.status,
        context_id: this.contextId,
      });
      logInfo(responseData);
      return Promise.resolve({
        connected: !!responseData.status.code,
        contextId: responseData.context_id,
        connectedDeviceId: responseData.status.connected_device_id,
      });
    } catch (error) {
      return Promise.reject(error);
    } finally {
      this.defineRequest();
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
      this.defineRequest(privateVariables.request.displayMessage);
      const responseData = await _connect(this._host, {
        request_type: privateVariables.request.displayMessage,
        context_id: this.contextId,
        display_message: {
          message,
        },
      });
      return Promise.resolve(responseData);
    } catch (error) {
      return Promise.reject(error);
    } finally {
      this.defineRequest();
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
      this.method = params.method || privateVariables.paymentMethods.credit;
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
      this.debugLog(`Iniciando processo de pagamento. Venda via ${this.method}, valor ${this.amount / 100}`);
      this.defineRequest(privateVariables.request.process);

      const response = await _connect(this._host, {
        request_type: privateVariables.request.process,
        context_id: this.contextId,
        process: {
          amount: this.amount,
          magstripe_payment_method: this.method,
        },
      });

      if (this.lastRequest === privateVariables.request.process) {
        if (response.error === privateVariables.errorStrings.errorOperationCanceled) {
          const error = {
            text: 'Operação cancelada pelo usuário.',
            type: 'cardCanceled',
          };
          this.debugLog(error.text);
          return Promise.reject(error);
        }

        if (
          response.error === privateVariables.errorStrings.errorOperationErrored
          || response.error === privateVariables.errorStrings.errorOperationFailed
        ) {
          const error = {
            text: 'Aconteceu algum erro na operação, tente novamente.',
            type: 'operationError',
          };
          this.debugLog(error.text);
          return Promise.reject(error);
        }

        if (response.response_type === privateVariables.response.processed) {
          return Promise.resolve(response.process);
        }
      }
    } catch (error) {
      return Promise.reject(error);
    } finally {
      this.defineRequest();
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
      this.defineRequest(privateVariables.request.finish);
      return await _connect(this._host, {
        request_type: privateVariables.request.finish,
        context_id: this.contextId,
        finish: {
          success: !!(code && emvData),
          response_code: code || '0000',
          emv_data: emvData || '000000000.0000',
        },
      });
    } catch (error) {
      return Promise.reject(error);
    } finally {
      this.defineRequest();
    }
  }
}

export default BifrostWebSocket;
