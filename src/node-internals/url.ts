import { ERR_INVALID_ARG_TYPE, ERR_INVALID_FILE_URL_PATH, ERR_INVALID_FILE_URL_HOST, ERR_INVALID_URL_SCHEME } from "./error";
import * as urlModule from "url";
import { URL, domainToUnicode } from "url";
import { platform } from "process";

import constants from "./constants";
const { CHAR_LOWERCASE_A, CHAR_LOWERCASE_Z } = constants;

declare global {
  interface String {
    codePointAt(pos:number): number;
  }
}

const isWindows = platform === 'win32';
const forwardSlashRegEx = /\//g;

function getPathFromURLWin32(url:URL) {
  const hostname = url.hostname;
  var pathname = url.pathname;
  for (var n = 0; n < pathname.length; n++) {
    if (pathname[n] === '%') {
      var third = pathname.codePointAt(n + 2) | 0x20;
      if ((pathname[n + 1] === '2' && third === 102) || // 2f 2F /
          (pathname[n + 1] === '5' && third === 99)) {  // 5c 5C \
        throw new ERR_INVALID_FILE_URL_PATH(
          'must not include encoded \\ or / characters'
        );
      }
    }
  }
  pathname = pathname.replace(forwardSlashRegEx, '\\');
  pathname = decodeURIComponent(pathname);
  if (hostname !== '') {
    // If hostname is set, then we have a UNC path
    // Pass the hostname through domainToUnicode just in case
    // it is an IDN using punycode encoding. We do not need to worry
    // about percent encoding because the URL parser will have
    // already taken care of that for us. Note that this only
    // causes IDNs with an appropriate `xn--` prefix to be decoded.
    return `\\\\${domainToUnicode(hostname)}${pathname}`;
  } else {
    // Otherwise, it's a local path that requires a drive letter
    var letter = pathname.codePointAt(1) | 0x20;
    var sep = pathname[2];
    if (letter < CHAR_LOWERCASE_A || letter > CHAR_LOWERCASE_Z ||   // a..z A..Z
        (sep !== ':')) {
      throw new ERR_INVALID_FILE_URL_PATH('must be absolute');
    }
    return pathname.slice(1);
  }
}

function getPathFromURLPosix(url:URL) {
  if (url.hostname !== '') {
    throw new ERR_INVALID_FILE_URL_HOST(platform);
  }
  const pathname = url.pathname;
  for (var n = 0; n < pathname.length; n++) {
    if (pathname[n] === '%') {
      var third = pathname.codePointAt(n + 2) | 0x20;
      if (pathname[n + 1] === '2' && third === 102) {
        throw new ERR_INVALID_FILE_URL_PATH(
          'must not include encoded / characters'
        );
      }
    }
  }
  return decodeURIComponent(pathname);
}

function poly_fileURLToPath(pathArg:string|URL):string {
  const path:URL = typeof pathArg === 'string' ? new URL(pathArg) : pathArg;
  if (path == null || !(path instanceof URL))
    throw new ERR_INVALID_ARG_TYPE('path', ['string', 'URL'], path);
  if (path.protocol !== 'file:')
    throw new ERR_INVALID_URL_SCHEME('file');
  return isWindows ? getPathFromURLWin32(path) : getPathFromURLPosix(path);
}

export var fileURLToPath = ('fileURLToPath' in urlModule)
                         ? urlModule.fileURLToPath
                         : poly_fileURLToPath;
