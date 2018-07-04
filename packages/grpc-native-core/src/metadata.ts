/**
 * @license
 * Copyright 2015 gRPC authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

'use strict';

import * as _ from 'lodash';

import grpc from './grpc_extension';
import { GRPC_TYPE_TODO } from './common';

interface MetadataInternalArray {
  [index: string]: any;
}

export type MetadataValue = string | Buffer;

/**
 * Class for storing metadata. Keys are normalized to lowercase ASCII.
 * @memberof grpc
 * @example
 * const metadata = new metadata_module.Metadata();
 * metadata.set('key1', 'value1');
 * metadata.add('key1', 'value2');
 * metadata.get('key1') // returns ['value1', 'value2']
 */
export class Metadata {
  private _internal_repr: MetadataInternalArray = [];

  /**
   * Sets the given value for the given key, replacing any other values associated
   * with that key. Normalizes the key.
   * @param key The key to set
   * @param value The value to set. Must be a buffer if and only
   *     if the normalized key ends with '-bin'
   */
  set(key: string, value: MetadataValue): void {
    key = normalizeKey(key);
    validate(key, value);
    this._internal_repr[key] = [value];
  }

  /**
   * Adds the given value for the given key. Normalizes the key.
   * @param key The key to add to.
   * @param value The value to add. Must be a buffer if and only
   *     if the normalized key ends with '-bin'
   */
  add(key: string, value: MetadataValue): void {
    key = normalizeKey(key);
    validate(key, value);
    if (!this._internal_repr[key]) {
      this._internal_repr[key] = [];
    }
    this._internal_repr[key].push(value);
  }

  /**
   * Remove the given key and any associated values. Normalizes the key.
   * @param key The key to remove
   */
  remove(key: string): void {
    key = normalizeKey(key);
    if (Object.prototype.hasOwnProperty.call(this._internal_repr, key)) {
      delete this._internal_repr[key];
    }
  }

  /**
   * Gets a list of all values associated with the key. Normalizes the key.
   * @param key The key to get
   * @return The values associated with that key
   */
  get(key: string): MetadataValue[] {
    key = normalizeKey(key);
    if (Object.prototype.hasOwnProperty.call(this._internal_repr, key)) {
      return this._internal_repr[key];
    } else {
      return [];
    }
  }

  /**
   * Get a map of each key to a single associated value. This reflects the most
   * common way that people will want to see metadata.
   * @return A key/value mapping of the metadata
   */
  getMap(): { [key: string]: MetadataValue } {
    const result: { [key: string]: MetadataValue } = {};
    _.forOwn(this._internal_repr, (values, key) => {
      if (values.length > 0) {
        result[key] = values[0];
      }
    });
    return result;
  }

  /**
   * Clone the metadata object.
   * The new cloned object
   */
  clone(): Metadata {
    const copy = new Metadata();
    _.forOwn(this._internal_repr, (value, key) => {
      copy._internal_repr[key] = _.clone(value);
    });
    return copy;
  }

  /**
   * Gets the metadata in the format used by interal code. Intended for internal
   * use only. API stability is not guaranteed.
   * @private
   * @return {Object.<String, Array.<String|Buffer>>} The metadata
   */
  _getCoreRepresentation(): GRPC_TYPE_TODO {
    return this._internal_repr;
  }

  /**
   * Creates a Metadata object from a metadata map in the internal format.
   * Intended for internal use only. API stability is not guaranteed.
   * @private
   * @param {Object.<String, Array.<String|Buffer>>} The metadata
   * @return {Metadata} The new Metadata object
   */
  static _fromCoreRepresentation(metadata: GRPC_TYPE_TODO): Metadata {
    const newMetadata = new Metadata();
    if (metadata) {
      _.forOwn(metadata, (value, key) => {
        newMetadata._internal_repr[key] = _.clone(value);
      });
    }
    return newMetadata;
  }
}


function normalizeKey(key: string) {
  key = key.toLowerCase();
  if (grpc.metadataKeyIsLegal(key)) {
    return key;
  } else {
    throw new Error(`Metadata key"${key}" contains illegal characters`);
  }
}

function validate(key: string, value: MetadataValue) {
  if (grpc.metadataKeyIsBinary(key)) {
    if (!(value instanceof Buffer)) {
      throw new Error('keys that end with \'-bin\' must have Buffer values');
    }
  } else {
    if (!_.isString(value)) {
      throw new Error(
        'keys that don\'t end with \'-bin\' must have String values');
    }
    if (!grpc.metadataNonbinValueIsLegal(value)) {
      throw new Error(`Metadata string value "${value}" contains illegal characters`);
    }
  }
}

