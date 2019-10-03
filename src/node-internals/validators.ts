import { ERR_INVALID_ARG_TYPE } from './error';

export function validateString(value:any, name:string):void {
  if (typeof value !== 'string')
    throw new ERR_INVALID_ARG_TYPE(name, 'string', value);
}