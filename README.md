
redux-schemad
-------------

I got tired of writing reducers, action creators, and looking up my state schema. I also didn't want to invest in a huge library. Here's some functions.

Example:

```javascript

import {
  createFromSchema,
  field, embed, embedMany,
  isRequired, isString, isNumber, isEmail,
} from 'redux-schemad'

const { defaultState, actions, actionTypes, reducer } = createFromSchema({
  dispatch,
  schema: {
    processId: field([isRequired, isString], 'abcd1234'),
    group: embed({
      bagId: field([isRequired, isString]),
      bagCount: field([isNumber], 0),
    }),
    users: embedMany('id', {
      id: field([isRequired, isString]),
      email: field([isString, isEmail]),
      name: field([isString]),
    }),
  },
})

// results in
{
  defaultState: {
    processId: 'abcd1234',
    group: {
      bagId: null,
      isNumber: 0,
    },
    users: {},
  },
  actionTypes: {
    SET_PROCESS_ID
    CLEAR_PROCESS_ID
    RESET_PROCESS_ID
    // ---
    SET_GROUP
    UPDATE_GROUP
    CLEAR_GROUP
    RESET_GROUP
    // ---
    SET_USER
    UPDATE_USER
    CLEAR_USER
    RESET_USER
    SET_USERS
    UPDATE_USERS
    RESET_USERS
    CLEAR_USERS
  },
  actions: {
    setProcessId(processId) => { type: SET_PROCESS_ID, payload: { processId } }
    clearProcessId() => { type }
    resetProcessId() => { type, payload: { processId: 'abcd1234' } }
    ---
    setGroup({ bagId = 'wxyz0987', bagCount = 4 }) => { type, payload: { bagId, bagCount } }
    updateGroup({ bagId = 'qwer2345' }) => { type, payload: { bagId } }
    clearGroup() => { type }
    resetGroup() => { type, payload: { bagCount: 0 } }
    ---
    setUser({ id: 1, email: 'f@c.c' }) => { type, payload: { ... } }
    updateUser({ id: 1, email: 'g@c.c' }) => { type, payload: { ... } }
    clearUser({ id: 1 }) => { type, payload }
    resetUser({ id: 1 }) => { type, payload }
    setUsers({ [id]: { } }) => { type, payload }
    updateUsers({ [id]: { } }) => { type, payload }
    clearUsers() => { type }
  },
  reducer: fn...
}

```
