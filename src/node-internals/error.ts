import assert from 'assert';
import { inspect } from 'util';

function oneOf(expected:string|string[], thing:string):string {
  assert(typeof thing === 'string', '`thing` has to be of type string');
  if (Array.isArray(expected)) {
    const len = expected.length;
    assert(len > 0,
           'At least one expected value needs to be specified');
    expected = expected.map((i) => String(i));
    if (len > 2) {
      return `one of ${thing} ${expected.slice(0, len - 1).join(', ')}, or ` +
             expected[len - 1];
    } else if (len === 2) {
      return `one of ${thing} ${expected[0]} or ${expected[1]}`;
    } else {
      return `of ${thing} ${expected[0]}`;
    }
  } else {
    return `of ${thing} ${String(expected)}`;
  }
}

function makeNodeErrorWithCode(Base:new(...args:any[])=>Error, key:string, messageFunc:(...args:any[])=>string):new (...args:any[])=>Error {
  return class NodeError extends Base {
    constructor(...args:any[]) {
      super();
      const message = messageFunc(...args);
      Object.defineProperty(this, 'message', {
        value: message,
        enumerable: false,
        writable: true,
        configurable: true
      });
    }

    get code():string {
      return key;
    }

    set code(value:string) {
      Object.defineProperty(this, 'code', {
        configurable: true,
        enumerable: true,
        value,
        writable: true
      });
    }

    toString():string {
      return `${this.name} [${key}]: ${this.message}`;
    }
  };
}
function E(sym:string, val:(...args:any[])=>string, def:new(...args:any[])=>Error, ...otherClasses:(new(...args:any[])=>Error)[]):new (...args:any[])=>Error {
  def = makeNodeErrorWithCode(def, sym, val);
  if (otherClasses.length !== 0) {
    otherClasses.forEach((cls) => {
      (def as any)[cls.name] = makeNodeErrorWithCode(cls, sym, val);
    });
  }
  return def;
}


export const ERR_INVALID_ARG_VALUE = E('ERR_INVALID_ARG_VALUE',(name:string, value:any, reason:string = 'is invalid') => {
    let inspected:string = inspect(value);
    if (inspected.length > 128) {
      inspected = `${inspected.slice(0, 128)}...`;
    }
    return `The argument '${name}' ${reason}. Received ${inspected}`;
  }, TypeError, RangeError);
export const ERR_INVALID_ARG_TYPE = E('ERR_INVALID_ARG_TYPE',(name:string, expected:string|string[], actual:any) => {
    assert(typeof name === 'string', "'name' must be a string");

    // determiner: 'must be' or 'must not be'
    let determiner:string;
    if (typeof expected === 'string' && expected.startsWith('not ')) {
      determiner = 'must not be';
      expected = expected.replace(/^not /, '');
    } else {
      determiner = 'must be';
    }

    let msg;
    if (name.endsWith(' argument')) {
      // For cases like 'first argument'
      msg = `The ${name} ${determiner} ${oneOf(expected, 'type')}`;
    } else {
      const type = name.includes('.') ? 'property' : 'argument';
      msg = `The "${name}" ${type} ${determiner} ${oneOf(expected, 'type')}`;
    }

    // TODO(BridgeAR): Improve the output by showing `null` and similar.
    msg += `. Received type ${typeof actual}`;
    return msg;
  }, TypeError);

export const ERR_INVALID_URL_SCHEME = E('ERR_INVALID_URL_SCHEME',(expected:string|string[]) =>
    `The URL must be ${oneOf(expected, 'scheme')}`, TypeError);

export const ERR_INVALID_FILE_URL_PATH = E('ERR_INVALID_FILE_URL_PATH',(actual:string) =>
    `File URL path ${actual}`, TypeError);

export const ERR_INVALID_FILE_URL_HOST = E('ERR_INVALID_FILE_URL_HOST',(platform:string) =>
    `File URL host must be "localhost" or empty on ${platform}`, TypeError);

export const ERR_INVALID_OPT_VALUE = E('ERR_INVALID_OPT_VALUE',(name:string,value:any) =>
    `The value "${String(value)}" is invalid for options "${name}"`, TypeError, RangeError);
