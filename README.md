
# Bifrost.JS
Uma forma mais fácil de implementar o websocket da Auttar em seu sistema.

## Como Usar

Com NPM
```bash
$ npm install bifrost-js
```

Como CDN
```html
<script src="https://raw.githubusercontent.com/bloodf/bifrost-js/master/dist/index.js"></script>
```

### API
#### Classe
Iniciando a classe
```JS
import PagarMeBifrost from 'bifrost-js';

const Bifrost = new PagarMeBifrost({
  contextId: 'ABC123',
  encryptionKey: 'ENCKEY',
});
```

##### Construtor
|Propiedade|Tipo|Default|
|--|--|--|
| debug | boolean | Ativa o modo de Debug |
| host | string | Endereço de conexão do WebSocket |
| contextId | string | ID do contexto de conexão |
| baudRate | number | Taxa de comunicação |
| encryptionKey | string | Chave de criptografia Pagar.ME |
| pinPadMaxCharLine | number | Quantidade máxima de caracteres por linha do PinPad |
| pinPadMaxChar | number | Quantidade máxima de caracteres na tela do PinPad |
| pinPanDisplayLines | number | Número de linhas disponíveis no PinPad |

#### initialize
Inicializa o WebSocket. Caso esteja tudo Ok, será retornado `true`, senão um `Error`

```JS
  Bifrost.initialize();
```

#### terminate
Finaliza o WebSocket. Caso esteja tudo Ok, será retornado `true`, senão um `Error`

```JS
  Bifrost.terminate();
```

#### status
Retorna o status do WebSocket. Caso esteja tudo Ok, será retornado um objeto de status `BifrostServiceStatus`, senão um `Error`

```JS
  /**
   * @typedef {object} BifrostServiceStatus
   * @property {boolean} connected - Is device connected
   * @property {string} contextId - Device Context
   * @property {string} connectedDeviceId - Connected Device Id
   */
  Bifrost.status();
```

#### showMessage
Exibe uma mensagem ou array de mensagens no display do Pinpad.

```JS
  Bifrost.showMessage('MSG' || ['MSG']);
```

#### payment
Inicializa o processo de pagamento no WebSocket, você deve passar dois parâmetros. O primeiro é o valor (float) e o segundo o metodo de pagamento ('credit'|'debit'|1|2). Caso esteja tudo Ok, será retornado `PinPadProcessedCardReturn`, senão um `Error`

```JS
  /**
   * @typedef {object} PinPadProcessedCardReturn
   * @property {string} card_hash
   * @property {string} card_holder_name
   * @property {number} error_code
   * @property {boolean} is_online_pin
   * @property {number} payment_method
   * @property {number} status
   */
  const amount = 10; // Float
  const method = 'credit'; // 'credit'|'debit'|1|2
  Bifrost.payment(amount, method);
```

#### finish
Finaliza o processo de pagamento no WebSocket, após o pagamento iniciado e o backEnd processado ele, você deve passar os códigos devolvidos pelo backend para o serviço de WebSocket. Caso esteja tudo Ok, será retornado a resposta do serviço `Object`, senão um `Error`

```JS
  Bifrost.finish({
    code: '', // Código devolvido pelo servidor
    emvData: '', // Código devolvido pelo servidor
    messages: [''], // Array de mensagens para serem mostradas no PinPad
  });
```

### Exemplo
```JS
import PagarMeBifrost from 'bifrost-js';

const Bifrost = new PagarMeBifrost({
  contextId: 'ABC123',
  encryptionKey: 'ENCKEY',
});
// Inicializando o serviço
Bifrost.initialize()
.then((status) =>{
  if(status){
    Bifrost.showMessage('Msg no PINPAD');
  }
})
.catch(() => {
  Bifrost.terminate();
});

// Fazendo um pagamento via crédito
Bifrost.payment(10.00, 'credit')
.then((response) => {
  /* Após enviar para o backend a resposta (response)
  * você vai receber os dados para a finalização 
  * */
  Bifrost.finish({
    code: '', // Código devolvido pelo servidor
    emvData: '', // Código devolvido pelo servidor
    messages: [''], // Array de mensagens para serem mostradas no PinPad
  });
});

```
