'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var WebSocketAsPromised = _interopDefault(require('websocket-as-promised'));

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var runtime = createCommonjsModule(function (module) {
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

!(function(global) {

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = module.exports;

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  runtime.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  runtime.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        if (delegate.iterator.return) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };
})(
  // In sloppy mode, unbound `this` refers to the global object, fallback to
  // Function constructor if we're in global strict mode. That is sadly a form
  // of indirect eval which violates Content Security Policy.
  (function() {
    return this || (typeof self === "object" && self);
  })() || Function("return this")()
);
});

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This method of obtaining a reference to the global object needs to be
// kept identical to the way it is obtained in runtime.js
var g = (function() {
  return this || (typeof self === "object" && self);
})() || Function("return this")();

// Use `getOwnPropertyNames` because not all browsers support calling
// `hasOwnProperty` on the global `self` object in a worker. See #183.
var hadRuntime = g.regeneratorRuntime &&
  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;

// Save the old regeneratorRuntime in case it needs to be restored later.
var oldRuntime = hadRuntime && g.regeneratorRuntime;

// Force reevalutation of runtime.js.
g.regeneratorRuntime = undefined;

var runtimeModule = runtime;

if (hadRuntime) {
  // Restore the original runtime.
  g.regeneratorRuntime = oldRuntime;
} else {
  // Remove the global property added by runtime.js.
  try {
    delete g.regeneratorRuntime;
  } catch(e) {
    g.regeneratorRuntime = undefined;
  }
}

var regenerator = runtimeModule;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

var asyncToGenerator = _asyncToGenerator;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var classCallCheck = _classCallCheck;

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var createClass = _createClass;

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }
}

var arrayWithoutHoles = _arrayWithoutHoles;

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

var iterableToArray = _iterableToArray;

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

var nonIterableSpread = _nonIterableSpread;

function _toConsumableArray(arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || nonIterableSpread();
}

var toConsumableArray = _toConsumableArray;

var NAME = '%c Pagar.Me Bifrost ';
var BACKGROUND = 'background:#f26722 ; padding: 2px; border-radius: 2px;  color: #fff ';
function required(name, param) {
  if (param === undefined) {
    throw new Error("Par\xE2metro obrigat\xF3rio ".concat(name, " n\xE3o declarado."));
  }

  return param;
}
function logInfo(msg) {
  console.log(NAME, BACKGROUND, msg); // eslint-disable-line no-console
}
function logError(msg) {
  console.error(NAME, BACKGROUND, msg); // eslint-disable-line no-console
}
/**
 * Add spaces to match the max screen length
 * @param {string} text
 * @param {number} maxChar
 * @returns {string}
 */

function addSpaces(text, maxChar) {
  var _text$split;

  return (_text$split = text.split('')).concat.apply(_text$split, toConsumableArray(Array(maxChar).fill(' '))).slice(0, maxChar).join('');
}

var _typeof_1 = createCommonjsModule(function (module) {
function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;
});

var BifrostWebSocket =
/*#__PURE__*/
function () {
  function BifrostWebSocket(_ref) {
    var contextId = _ref.contextId,
        baudRate = _ref.baudRate,
        debug = _ref.debug,
        host = _ref.host;

    classCallCheck(this, BifrostWebSocket);

    this.debug = debug || false;
    this.contextId = required('contextId', contextId);
    this.baudRate = baudRate || 115200;
    this._connected = false;
    this.devices = [];
    this._host = host || 'wss://localhost:2000/mpos';
    this.ws = new WebSocketAsPromised(this._host, {
      packMessage: function packMessage(data) {
        return JSON.stringify(data);
      },
      unpackMessage: function unpackMessage(message) {
        return JSON.parse(message);
      },
      attachRequestId: function attachRequestId(data, requestId) {
        return Object.assign({
          request_type: requestId
        }, data);
      },
      extractRequestId: function extractRequestId(data) {
        return data && data.response_type;
      }
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
      error: 9
    };
    this.__request = {
      listDevices: 1,
      initialize: 2,
      process: 4,
      finish: 5,
      displayMessage: 6,
      status: 7,
      closeContext: 8
    };
    this.__errorContextString = 'Device already in use by context ';
    this.__errorInitialize = 'An error has occured with the [Initialize] request. See the log and contact the support.';
    this.__errorOperationErrored = 'Transaction Errored';
    this.__errorOperationFailed = 'Error: 43';
    this.__errorOperationCanceled = 'Transaction Canceled';
    this.__catastroficError = 'Error: 14';
    this.__paymentMethods = {
      credit: 1,
      debit: 2
    };
  }

  createClass(BifrostWebSocket, [{
    key: "debugLog",
    value: function debugLog(message) {
      if (this.debug) {
        logInfo(message);
      }
    }
  }, {
    key: "classError",
    value: function classError(message) {
      this.debugLog(_typeof_1(message) === 'object' ? message.text : message);
      throw new Error(message);
    }
  }, {
    key: "defineRequest",
    value: function defineRequest(value) {
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

  }, {
    key: "startWsConnection",
    value: function () {
      var _startWsConnection = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee() {
        return regenerator.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                this.debugLog('Abrindo conexão com o WebSocket.');
                _context.next = 4;
                return this.ws.open();

              case 4:
                this._wsConnected = true;
                return _context.abrupt("return", true);

              case 8:
                _context.prev = 8;
                _context.t0 = _context["catch"](0);
                logError(_context.t0, true);
                return _context.abrupt("return", false);

              case 12:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 8]]);
      }));

      function startWsConnection() {
        return _startWsConnection.apply(this, arguments);
      }

      return startWsConnection;
    }()
    /**
     * Terminate the connection to the Bifrost WebSocket
     * @returns {Promise<void>}
     */

  }, {
    key: "closeWsConnection",
    value: function () {
      var _closeWsConnection = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee2() {
        return regenerator.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                this.debugLog('Fechando conexão com o WebSocket.');
                _context2.next = 4;
                return this.ws.close();

              case 4:
                this._wsConnected = false;
                _context2.next = 10;
                break;

              case 7:
                _context2.prev = 7;
                _context2.t0 = _context2["catch"](0);
                logError(_context2.t0, true);

              case 10:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[0, 7]]);
      }));

      function closeWsConnection() {
        return _closeWsConnection.apply(this, arguments);
      }

      return closeWsConnection;
    }()
    /**
     * Terminate the context of the PinPad device
     * @param {string} contextId = null - Optional ContextId to be terminated
     * @returns {Promise<*>}
     */

  }, {
    key: "closePinPadContext",
    value: function () {
      var _closePinPadContext = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee3() {
        var contextId,
            responseData,
            _args3 = arguments;
        return regenerator.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                contextId = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : this.contextId;
                _context3.prev = 1;
                this.debugLog('Fechando contexto do Serviço Bifrost.');
                this.defineRequest(this.__request.closeContext);
                _context3.next = 6;
                return this.ws.sendRequest({
                  request_type: this.__request.closeContext,
                  context_id: contextId
                }, {
                  requestId: this.__request.closeContext
                });

              case 6:
                responseData = _context3.sent;
                this._connected = false;
                this.defineRequest();
                return _context3.abrupt("return", Promise.resolve(responseData));

              case 12:
                _context3.prev = 12;
                _context3.t0 = _context3["catch"](1);
                this.defineRequest();
                _context3.next = 17;
                return this.closeWsConnection();

              case 17:
                return _context3.abrupt("return", Promise.reject(_context3.t0));

              case 18:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[1, 12]]);
      }));

      function closePinPadContext() {
        return _closePinPadContext.apply(this, arguments);
      }

      return closePinPadContext;
    }()
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

  }, {
    key: "getPinPadDevices",
    value: function () {
      var _getPinPadDevices = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee4() {
        var responseData;
        return regenerator.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.prev = 0;
                this.debugLog('Buscando lista de dispositivos do sistema.');
                this.defineRequest(this.__request.listDevices);
                _context4.next = 5;
                return this.ws.sendRequest({
                  request_type: this.__request.listDevices,
                  context_id: this.contextId
                }, {
                  requestId: this.__request.listDevices
                });

              case 5:
                responseData = _context4.sent;
                this.debugLog(responseData);
                this.devices = responseData.device_list;
                this.defineRequest();
                return _context4.abrupt("return", Promise.resolve(this.devices));

              case 12:
                _context4.prev = 12;
                _context4.t0 = _context4["catch"](0);
                this.defineRequest();
                return _context4.abrupt("return", Promise.reject(_context4.t0));

              case 16:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this, [[0, 12]]);
      }));

      function getPinPadDevices() {
        return _getPinPadDevices.apply(this, arguments);
      }

      return getPinPadDevices;
    }()
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

  }, {
    key: "initialize",
    value: function () {
      var _initialize = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee6(params) {
        var _this = this;

        var deviceIndex,
            _args6 = arguments;
        return regenerator.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                deviceIndex = _args6.length > 1 && _args6[1] !== undefined ? _args6[1] : 0;
                _context6.prev = 1;

                if (this._wsConnected) {
                  _context6.next = 5;
                  break;
                }

                _context6.next = 5;
                return this.startWsConnection();

              case 5:
                this.debugLog("Conectando ao PinPad ".concat(this.devices[deviceIndex].id, "."));
                this.defineRequest(this.__request.initialize);
                this.ws.sendPacked({
                  request_type: this.__request.initialize,
                  context_id: this.contextId,
                  initialize: {
                    device_id: this.devices[deviceIndex].id,
                    encryption_key: params.encryptionKey,
                    baud_rate: this.baudRate,
                    simple_initialize: params.simpleInitialize,
                    timeout_milliseconds: params.timeoutMilliseconds
                  }
                });
                this.ws.onMessage.addListener(
                /*#__PURE__*/
                function () {
                  var _ref2 = asyncToGenerator(
                  /*#__PURE__*/
                  regenerator.mark(function _callee5(message) {
                    var response, nextDevice, context;
                    return regenerator.wrap(function _callee5$(_context5) {
                      while (1) {
                        switch (_context5.prev = _context5.next) {
                          case 0:
                            if (!(_this.lastRequest === _this.__request.initialize)) {
                              _context5.next = 42;
                              break;
                            }

                            _this.defineRequest();

                            response = JSON.parse(message);

                            if (!(response.response_type === _this.__response.initialized)) {
                              _context5.next = 7;
                              break;
                            }

                            _this._connected = true;

                            _this.ws.removeAllListeners();

                            return _context5.abrupt("return", _this.debugLog("PinPad ".concat(_this.devices[deviceIndex].id, " inicializado com sucesso.")));

                          case 7:
                            if (!(response.response_type === _this.__response.alreadyInitialized)) {
                              _context5.next = 15;
                              break;
                            }

                            _this.debugLog('Serviço Bifrost já inicializado, reiniciando a conexão.');

                            _this.ws.removeAllListeners();

                            _context5.next = 12;
                            return _this.closePinPadContext(response.context_id);

                          case 12:
                            _context5.next = 14;
                            return _this.initialize({
                              encryptionKey: params.encryptionKey,
                              baud_rate: _this.baudRate,
                              simpleInitialize: params.simpleInitialize,
                              timeoutMilliseconds: params.timeoutMilliseconds
                            }, 0);

                          case 14:
                            return _context5.abrupt("return", false);

                          case 15:
                            if (!(response.response_type === _this.__response.error && _this.__errorInitialize)) {
                              _context5.next = 28;
                              break;
                            }

                            nextDevice = deviceIndex + 1;

                            if (!(nextDevice > _this.devices.length)) {
                              _context5.next = 23;
                              break;
                            }

                            _context5.next = 20;
                            return _this.closeWsConnection();

                          case 20:
                            _this.classError('Não foi possível inicial a conexão com nenhum dispositivo.');

                            _context5.next = 28;
                            break;

                          case 23:
                            _this.debugLog('Dispositivo selecionado não é válido, inicializando novamente com próximo dispositivo da lista.');

                            _this.ws.removeAllListeners();

                            _context5.next = 27;
                            return _this.initialize({
                              encryptionKey: params.encryptionKey,
                              baud_rate: _this.baudRate,
                              simpleInitialize: params.simpleInitialize,
                              timeoutMilliseconds: params.timeoutMilliseconds
                            }, nextDevice);

                          case 27:
                            return _context5.abrupt("return", false);

                          case 28:
                            if (!(response.error === _this.__catastroficError)) {
                              _context5.next = 32;
                              break;
                            }

                            _this.classError('Erro catastrófico no sistema. Por favor, reinicialize o PinPad e o Serviço do Bifrost');

                            _this.ws.removeAllListeners();

                            return _context5.abrupt("return", false);

                          case 32:
                            if (!(response.error && response.error.includes(_this.__errorContextString))) {
                              _context5.next = 42;
                              break;
                            }

                            _this.debugLog('Serviço Bifrost com contexto diferente do definido na classe.');

                            _this.ws.removeAllListeners();

                            context = response.error.split(_this.__errorContextString)[1];
                            _context5.next = 38;
                            return _this.closePinPadContext(context);

                          case 38:
                            if (!_context5.sent) {
                              _context5.next = 41;
                              break;
                            }

                            _context5.next = 41;
                            return _this.initialize({
                              encryptionKey: params.encryptionKey,
                              baud_rate: _this.baudRate,
                              simpleInitialize: params.simpleInitialize,
                              timeoutMilliseconds: params.timeoutMilliseconds
                            }, 0);

                          case 41:
                            return _context5.abrupt("return", false);

                          case 42:
                            return _context5.abrupt("return", message);

                          case 43:
                          case "end":
                            return _context5.stop();
                        }
                      }
                    }, _callee5);
                  }));

                  return function (_x2) {
                    return _ref2.apply(this, arguments);
                  };
                }());
                return _context6.abrupt("return", true);

              case 12:
                _context6.prev = 12;
                _context6.t0 = _context6["catch"](1);
                this.defineRequest();
                return _context6.abrupt("return", Promise.reject(_context6.t0));

              case 16:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this, [[1, 12]]);
      }));

      function initialize(_x) {
        return _initialize.apply(this, arguments);
      }

      return initialize;
    }()
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

  }, {
    key: "getPinPanStatus",
    value: function () {
      var _getPinPanStatus = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee7() {
        var responseData;
        return regenerator.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.prev = 0;
                this.debugLog('Buscando status do serviço Bifrost.');
                this.defineRequest(this.__request.status);
                _context7.next = 5;
                return this.ws.sendRequest({
                  request_type: this.__request.status,
                  context_id: this.contextId
                }, {
                  requestId: this.__response.status
                });

              case 5:
                responseData = _context7.sent;
                logInfo(responseData);
                return _context7.abrupt("return", Promise.resolve({
                  connected: !!responseData.status.code,
                  contextId: responseData.context_id,
                  connectedDeviceId: responseData.status.connected_device_id
                }));

              case 10:
                _context7.prev = 10;
                _context7.t0 = _context7["catch"](0);
                this.defineRequest();
                return _context7.abrupt("return", Promise.reject(_context7.t0));

              case 14:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this, [[0, 10]]);
      }));

      function getPinPanStatus() {
        return _getPinPanStatus.apply(this, arguments);
      }

      return getPinPanStatus;
    }()
    /**
     * Display a message on the PinPad Device
     * @param message
     * @returns {Promise<*>}
     */

  }, {
    key: "displayMessageOnPinPadScreen",
    value: function () {
      var _displayMessageOnPinPadScreen = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee8(message) {
        var responseData;
        return regenerator.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.prev = 0;
                this.debugLog("Mostrando \"".concat(message, "\" no display do PinPad."));
                this.defineRequest(this.__request.displayMessage);
                _context8.next = 5;
                return this.ws.sendRequest({
                  request_type: this.__request.displayMessage,
                  context_id: this.contextId,
                  display_message: {
                    message: message
                  }
                }, {
                  requestId: this.__response.messageDisplayed
                });

              case 5:
                responseData = _context8.sent;
                this.defineRequest();
                return _context8.abrupt("return", Promise.resolve(responseData));

              case 10:
                _context8.prev = 10;
                _context8.t0 = _context8["catch"](0);
                this.defineRequest();
                return _context8.abrupt("return", Promise.reject(_context8.t0));

              case 14:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this, [[0, 10]]);
      }));

      function displayMessageOnPinPadScreen(_x3) {
        return _displayMessageOnPinPadScreen.apply(this, arguments);
      }

      return displayMessageOnPinPadScreen;
    }()
    /**
     * @typedef {object} PaymentStartObject
     * @property {number} amount
     * @property {string} method = 'credit'|'debit'
     */

    /**
     * Start the payment process by setting the amount and method.
     * @param {PaymentStartObject} params
     */

  }, {
    key: "startPayment",
    value: function startPayment(params) {
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

  }, {
    key: "startPaymentProcess",
    value: function () {
      var _startPaymentProcess = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee10() {
        var _this2 = this;

        return regenerator.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _context10.prev = 0;
                return _context10.abrupt("return", new Promise(function (resolve, reject) {
                  _this2.debugLog("Iniciando processo de pagamento. Venda via ".concat(_this2.method, ", valor ").concat(_this2.amount / 100));

                  _this2.defineRequest(_this2.__request.process);

                  _this2.ws.sendPacked({
                    request_type: _this2.__request.process,
                    context_id: _this2.contextId,
                    process: {
                      amount: _this2.amount,
                      magstripe_payment_method: _this2.method
                    }
                  });

                  _this2.ws.onMessage.addListener(
                  /*#__PURE__*/
                  function () {
                    var _ref3 = asyncToGenerator(
                    /*#__PURE__*/
                    regenerator.mark(function _callee9(eventResponse) {
                      var response, error, _error;

                      return regenerator.wrap(function _callee9$(_context9) {
                        while (1) {
                          switch (_context9.prev = _context9.next) {
                            case 0:
                              if (!(_this2.lastRequest === _this2.__request.process)) {
                                _context9.next = 16;
                                break;
                              }

                              response = JSON.parse(eventResponse);

                              _this2.defineRequest();

                              if (!(response.error === _this2.__errorOperationCanceled)) {
                                _context9.next = 8;
                                break;
                              }

                              error = {
                                text: 'Operação cancelada pelo usuário.',
                                type: 'cardCanceled'
                              };

                              _this2.debugLog(error.text);

                              _this2.ws.removeAllListeners();

                              return _context9.abrupt("return", reject(error));

                            case 8:
                              if (!(response.error === _this2.__errorOperationErrored || response.error === _this2.__errorOperationFailed)) {
                                _context9.next = 13;
                                break;
                              }

                              _error = {
                                text: 'Aconteceu algum erro na operação, tente novamente.',
                                type: 'operationError'
                              };

                              _this2.debugLog(_error.text);

                              _this2.ws.removeAllListeners();

                              return _context9.abrupt("return", reject(_error));

                            case 13:
                              if (!(response.response_type === _this2.__response.processed)) {
                                _context9.next = 16;
                                break;
                              }

                              _this2.ws.removeAllListeners();

                              return _context9.abrupt("return", resolve(response.process));

                            case 16:
                              return _context9.abrupt("return", eventResponse);

                            case 17:
                            case "end":
                              return _context9.stop();
                          }
                        }
                      }, _callee9);
                    }));

                    return function (_x4) {
                      return _ref3.apply(this, arguments);
                    };
                  }());
                }));

              case 4:
                _context10.prev = 4;
                _context10.t0 = _context10["catch"](0);
                this.defineRequest();
                return _context10.abrupt("return", Promise.reject(_context10.t0));

              case 8:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this, [[0, 4]]);
      }));

      function startPaymentProcess() {
        return _startPaymentProcess.apply(this, arguments);
      }

      return startPaymentProcess;
    }()
    /**
     * Finish the payment process of the PinPad
     * @param {string} code
     * @param {string} emvData
     * @returns {Promise<*>}
     */

  }, {
    key: "finishPaymentProcess",
    value: function () {
      var _finishPaymentProcess = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee11(code, emvData) {
        var process;
        return regenerator.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                _context11.prev = 0;
                this.debugLog("Finalizando a venda via ".concat(this.method));
                this.defineRequest(this.__request.finish);
                _context11.next = 5;
                return this.ws.sendRequest({
                  request_type: this.__request.finish,
                  context_id: this.contextId,
                  finish: {
                    success: !!(code && emvData),
                    response_code: code || '0000',
                    emv_data: emvData || '000000000.0000'
                  }
                }, {
                  requestId: this.__response.finished
                });

              case 5:
                process = _context11.sent;
                this.defineRequest();
                return _context11.abrupt("return", process);

              case 10:
                _context11.prev = 10;
                _context11.t0 = _context11["catch"](0);
                this.defineRequest();
                return _context11.abrupt("return", Promise.reject(_context11.t0));

              case 14:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this, [[0, 10]]);
      }));

      function finishPaymentProcess(_x5, _x6) {
        return _finishPaymentProcess.apply(this, arguments);
      }

      return finishPaymentProcess;
    }()
  }, {
    key: "amount",
    get: function get() {
      return this._amount; // eslint-disable-line
    },
    set: function set(value) {
      if (typeof value === 'number' && value <= 0) {
        throw new Error('Não é possível definir um valor menor ou igual a zero.');
      } else {
        this._amount = parseFloat(value) * 100;
      }
    }
  }, {
    key: "connected",
    get: function get() {
      return this._connected && this._wsConnected;
    }
  }, {
    key: "method",
    get: function get() {
      return this._method;
    },
    set: function set(value) {
      var _this3 = this;

      if (typeof value === 'string') {
        if (Object.keys(this.__paymentMethods).includes(value)) {
          this._method = value;
        }
      } else if (typeof value === 'number') {
        if (this.__paymentMethods.find(function (p) {
          return p === value;
        })) {
          this._method = Object.keys(this.__paymentMethods).find(function (k) {
            return _this3.__paymentMethods[k] === value;
          });
        }
      } else {
        throw new Error('Método de pagamento não permitido.');
      }
    }
  }]);

  return BifrostWebSocket;
}();

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


var PagarMeBifrost =
/*#__PURE__*/
function () {
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
  function PagarMeBifrost(params) {
    classCallCheck(this, PagarMeBifrost);

    try {
      this.baudRate = params.baudRate || 115200;
      this.contextId = required('contextId', params.contextId);
      this.encryptionKey = required('encryptionKey', params.encryptionKey);
      this.pinPadMaxCharLine = params.pinPadMaxCharLine || 16;
      this.pinPadMaxChar = params.pinPadMaxChar || 32;
      this.pinPanDisplayLines = params.pinPanDisplayLines || 2;
      var constructorOptions = {
        debug: params.debug || false,
        contextId: this.contextId,
        host: params.host || 'wss://localhost:2000/mpos'
      };
      this.__bifrost__ = new BifrostWebSocket(constructorOptions);
    } catch (error) {
      logError(error, true);
    }
  }

  createClass(PagarMeBifrost, [{
    key: "initialize",

    /**
     * Initialize the PinPad
     * @returns {Promise<boolean>}
     */
    value: function () {
      var _initialize = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee() {
        return regenerator.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return this.__bifrost__.startWsConnection();

              case 3:
                _context.next = 5;
                return this.__bifrost__.getPinPadDevices();

              case 5:
                _context.next = 7;
                return this.__bifrost__.initialize({
                  encryptionKey: this.encryptionKey
                });

              case 7:
                return _context.abrupt("return", Promise.resolve(true));

              case 10:
                _context.prev = 10;
                _context.t0 = _context["catch"](0);
                return _context.abrupt("return", Promise.reject(_context.t0));

              case 13:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 10]]);
      }));

      function initialize() {
        return _initialize.apply(this, arguments);
      }

      return initialize;
    }()
    /**
     * Terminate the PinPad
     * @returns {Promise<Boolean>}
     */

  }, {
    key: "terminate",
    value: function () {
      var _terminate = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee2() {
        return regenerator.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                if (!this.connected) notConnected();
                _context2.next = 4;
                return this.__bifrost__.closePinPadContext();

              case 4:
                _context2.next = 6;
                return this.__bifrost__.closeWsConnection();

              case 6:
                return _context2.abrupt("return", Promise.resolve(true));

              case 9:
                _context2.prev = 9;
                _context2.t0 = _context2["catch"](0);
                return _context2.abrupt("return", Promise.reject(_context2.t0));

              case 12:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[0, 9]]);
      }));

      function terminate() {
        return _terminate.apply(this, arguments);
      }

      return terminate;
    }()
    /**
     * Get the PinPad Status
     * @returns {Promise<Object.<BifrostServiceStatus>>}
     */

  }, {
    key: "status",
    value: function () {
      var _status = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee3() {
        return regenerator.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.prev = 0;
                if (!this.connected) notConnected();
                return _context3.abrupt("return", this.__bifrost__.getPinPanStatus());

              case 5:
                _context3.prev = 5;
                _context3.t0 = _context3["catch"](0);
                return _context3.abrupt("return", Promise.reject(_context3.t0));

              case 8:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[0, 5]]);
      }));

      function status() {
        return _status.apply(this, arguments);
      }

      return status;
    }()
    /**
     * Display a message on the PinPad
     * @param {string|array} message - A message string or an array of messages.
     * @returns {Promise<String>}
     */

  }, {
    key: "showMessage",
    value: function () {
      var _showMessage = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee4(message) {
        var tefMaxCharLine, tefMaxChar, formattedMessage;
        return regenerator.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.prev = 0;
                if (!this.connected) notConnected();
                tefMaxCharLine = this.pinPadMaxCharLine;
                tefMaxChar = this.pinPadMaxChar;
                formattedMessage = '';

                if (Array.isArray(message)) {
                  formattedMessage = message.slice(0, this.pinPanDisplayLines).map(function (m) {
                    return addSpaces(m, tefMaxCharLine);
                  }).join('');
                }

                if (typeof message === 'string') {
                  formattedMessage = addSpaces(message, tefMaxChar);
                }

                _context4.next = 9;
                return this.__bifrost__.displayMessageOnPinPadScreen(formattedMessage);

              case 9:
                return _context4.abrupt("return", Promise.resolve(formattedMessage));

              case 12:
                _context4.prev = 12;
                _context4.t0 = _context4["catch"](0);
                return _context4.abrupt("return", Promise.reject(_context4.t0));

              case 15:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this, [[0, 12]]);
      }));

      function showMessage(_x) {
        return _showMessage.apply(this, arguments);
      }

      return showMessage;
    }()
    /**
     * Start the payment process
     * @param {number} amount
     * @param {string|number} method = 'credit'|'debit'|1|2
     * @returns {Promise<Object.<PinPadProcessedCardReturn>>}
     */

  }, {
    key: "payment",
    value: function () {
      var _payment = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee7(amount, method) {
        var _this = this;

        var processedPayment;
        return regenerator.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.prev = 0;
                if (!this.connected) notConnected();

                this.__bifrost__.startPayment({
                  amount: amount,
                  method: method
                });

                _context7.next = 5;
                return this.__bifrost__.startPaymentProcess();

              case 5:
                processedPayment = _context7.sent;
                return _context7.abrupt("return", Promise.resolve(processedPayment));

              case 9:
                _context7.prev = 9;
                _context7.t0 = _context7["catch"](0);
                logError(_context7.t0);
                _context7.next = 14;
                return this.showMessage(_context7.t0.text);

              case 14:
                setTimeout(
                /*#__PURE__*/
                asyncToGenerator(
                /*#__PURE__*/
                regenerator.mark(function _callee6() {
                  return regenerator.wrap(function _callee6$(_context6) {
                    while (1) {
                      switch (_context6.prev = _context6.next) {
                        case 0:
                          _context6.next = 2;
                          return _this.finish();

                        case 2:
                          _context6.next = 4;
                          return _this.terminate();

                        case 4:
                          setTimeout(
                          /*#__PURE__*/
                          asyncToGenerator(
                          /*#__PURE__*/
                          regenerator.mark(function _callee5() {
                            return regenerator.wrap(function _callee5$(_context5) {
                              while (1) {
                                switch (_context5.prev = _context5.next) {
                                  case 0:
                                    _context5.next = 2;
                                    return _this.initialize();

                                  case 2:
                                  case "end":
                                    return _context5.stop();
                                }
                              }
                            }, _callee5);
                          })), 2000);

                        case 5:
                        case "end":
                          return _context6.stop();
                      }
                    }
                  }, _callee6);
                })), 2000);
                return _context7.abrupt("return", Promise.reject(_context7.t0));

              case 16:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this, [[0, 9]]);
      }));

      function payment(_x2, _x3) {
        return _payment.apply(this, arguments);
      }

      return payment;
    }()
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

  }, {
    key: "finish",
    value: function () {
      var _finish = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee10() {
        var _this2 = this;

        var params,
            code,
            emvData,
            timeOut,
            messages,
            processed,
            _args10 = arguments;
        return regenerator.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                params = _args10.length > 0 && _args10[0] !== undefined ? _args10[0] : {};
                _context10.prev = 1;
                if (!this.connected) notConnected();
                code = params.code || '';
                emvData = params.emvData || '';
                timeOut = params.timeout || 2000;
                messages = params.messages || null;
                _context10.next = 9;
                return this.__bifrost__.finishPaymentProcess(code, emvData);

              case 9:
                processed = _context10.sent;

                if (Array.isArray(messages)) {
                  messages.forEach(function (message, index) {
                    setTimeout(
                    /*#__PURE__*/
                    asyncToGenerator(
                    /*#__PURE__*/
                    regenerator.mark(function _callee8() {
                      return regenerator.wrap(function _callee8$(_context8) {
                        while (1) {
                          switch (_context8.prev = _context8.next) {
                            case 0:
                              _context8.next = 2;
                              return _this2.showMessage(message);

                            case 2:
                            case "end":
                              return _context8.stop();
                          }
                        }
                      }, _callee8);
                    })), timeOut * (index + 1));
                  });
                }

                if (typeof messages === 'string') {
                  setTimeout(
                  /*#__PURE__*/
                  asyncToGenerator(
                  /*#__PURE__*/
                  regenerator.mark(function _callee9() {
                    return regenerator.wrap(function _callee9$(_context9) {
                      while (1) {
                        switch (_context9.prev = _context9.next) {
                          case 0:
                            _context9.next = 2;
                            return _this2.showMessage(messages);

                          case 2:
                          case "end":
                            return _context9.stop();
                        }
                      }
                    }, _callee9);
                  })), timeOut);
                }

                return _context10.abrupt("return", Promise.resolve(processed));

              case 15:
                _context10.prev = 15;
                _context10.t0 = _context10["catch"](1);
                return _context10.abrupt("return", Promise.reject(_context10.t0));

              case 18:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this, [[1, 15]]);
      }));

      function finish() {
        return _finish.apply(this, arguments);
      }

      return finish;
    }()
  }, {
    key: "connected",
    get: function get() {
      return this.__bifrost__.connected;
    }
  }]);

  return PagarMeBifrost;
}();

module.exports = PagarMeBifrost;
