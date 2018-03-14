# redux-schemad

[![Build Status](https://img.shields.io/travis/heiskr/redux-schemad.svg?style=flat)](https://travis-ci.org/heiskr/redux-schemad)

Create automatic reducers, actions, and default state from a state schema.

I got tired of writing reducers, action creators, and looking up my state schema. I also didn't want to invest in a huge library; and I didn't want to totally abandon Redux. So here's some functions.

This module intentionally only supports what's necessary to follow the spirit of [_Avoiding Accidental Complexity When Structuring Your App State_](https://hackernoon.com/avoiding-accidental-complexity-when-structuring-your-app-state-6e6d22ad5e2a) by Tal Kol.

## Example

```javascript
import { createStore } from 'redux'
import {
  createReducer,
  createActions,
  field,
  collection,
} from 'redux-schemad'

const schema = {
  loggedInUserId: field([isRequired], 'erty1234'),
  settings: field([], {}),
  users: collection('id', {
    id: field([isRequired]),
    name: field([], 'tester'),
  }),
}
const reducer = createReducer(schema)
const store = createStore(reducer)
const [actions, actionTypes] = createActions(schema, store.dispatch)
```

In our basic example, we...

1. Create a schema, using `field` and `collection`
2. Create our reducer function using the schema. Remember, a reducer is just a function with the signature `(prevState, action) -> newState`.
3. Create your Redux store as normal using the reducer.
4. Create actions and a map of action types. Actions are bound to `store.dispatch`.

## Create a Schema: field, collection, validation rules

```javascript
import {
  field,
  collection,
} from 'redux-schemad'

const schema = {
  loggedInUserId: field([isRequired], 'erty1234'),
  settings: field([], {}),
  users: collection('id', {
    id: field([isRequired]),
    name: field([], 'tester'),
  }),
}
```

Create a schema. There are two types, fields and collections.

* `field`: Takes a list of validation functions, and optionally a default value.
* `collection`: Takes a identifier field name, and an object of fields. The default value for all collections is empty object `{}`.

### Validation Functions

Validation functions take the signature `(value, state) -> result`; where result is string if error, and falsy if good. We provide `isRequired`.

Generally speaking, if you want a field to be optional, then your validation functions need to return null if there is no value passed in.

## Action Types, Action Creators, and Default State

For _top level_ items in the schema, we will create the following actions and action types automatically. `createActions(schema, dispatch)` actions are bound to `store.dispatch` for your convenience.

### Action Types and Action Creators for Field

Where `field` below is replaced with the name:

* `SET_FIELD`: `setField(value)`
* `UPDATE_FIELD`: `updateField(value)`  _same as set for non-object fields_
* `RESET_FIELD`: `resetField()` -- Returns back to default value.

### Action Types and Action Creators for Collection

Where `items` below is replace with the name:

* `ADD_ITEM`: `addItem(payload)`
* `ADD_ITEMS`: `addItems([payload1, payload2, ...])`
* `UPDATE_ITEM`: `updateItem(payload)`
* `UPDATE_ITEMS`: `updateItems([payload1, payload2, ...])`
* `REMOVE_ITEM`: `removeItem(payload)`
* `REMOVE_ITEMS`: `remoteItems([payload1, payload2, ...])`
* `RESET_ITEMS`: `resetItems()` -- Returns back to empty object.

### Default State

The reducer will rely on the defaults in the schema to produce its initial state if you do not provide one. Collections always have a default state of empty object `{}`.

You can also generate this default state yourself: `const defaultState = createDefaultState(schema)`

## Reducer

`createReducer(schema)` creates a reducer that matches the schema. All actions mentioned above are supported.

The reducer will attempt to make the change described. _However_, if the resulting state does not meet the schema, the state will not update. Instead, you will get a warning in the console.

If you need additional functions, remember, a reducer is just a function that meets the criteria of `(prevState, action) -> newState`. You could do something like...

```javascript
function myReducer(state, action) {
  // other conditions...
  return schemadReducer(state, action)
}
```

---

```
redux-schemad
Copyright 2018 Kevin Heis and [contributors](https://github.com/heiskr/redux-schemad/graphs/contributors)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
