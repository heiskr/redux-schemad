const OBJ_CONST = {}.constructor
const GLOBAL_KEY = 'global'

function exists(value) {
  return typeof value !== 'undefined' && value != null
}

function isPlainObject(value) {
  return value.constructor === OBJ_CONST
}

function omitOne(obj, key) {
  const next = Object.assign({}, obj)
  delete next[key]
  return next
}

function fromEntries(arr) {
  return arr.reduce((sum, [key, value]) => {
    sum[key] = value
    return sum
  }, {})
}

function identity(a) {
  return a
}

function mapObj(obj, applyKey = identity, applyValue = identity) {
  return fromEntries(
    Object.keys(obj).map(key => [
      applyKey(key, obj[key]),
      applyValue(key, obj[key]),
    ])
  )
}

function camelToSnake(s) {
  return s
    .replace(/\.?([A-Z]+)/g, (x, y) => `_${y.toLowerCase()}`)
    .replace(/^_/, '')
    .toUpperCase()
}

function snakeToCamel(s) {
  return s.toLowerCase().replace(/_+(\w){1}/g, (x, y) => y.toUpperCase())
}

function diffKeys(a, b) {
  const bKeys = Object.keys(b)
  return Object.keys(a).filter(i => bKeys.indexOf(i) < 0)
}

function getSchemaCollectionIdName(schema, key) {
  return Object.keys(schema[key])[0].replace(/^\[(.*)\]$/, '$1')
}

function getSchemaCollectionFields(schema, key) {
  const idName = getSchemaCollectionIdName(schema, key)
  const firstKey = Object.keys(schema[key])[0]
  return omitOne(schema[key][firstKey], idName)
}

function getFieldActionType(name) {
  const snake = camelToSnake(name)
  return verb => verb + snake
}

function getCollectionActionType(
  manyName,
  oneName = manyName.replace(/s$/, '')
) {
  const snakeMany = camelToSnake(manyName)
  const snakeOne = camelToSnake(oneName)
  return verb => verb.replace('ITEMS', snakeMany).replace('ITEM', snakeOne)
}

// ////////////////////////////////////////////////

function setField(name) {
  return (state, action) => {
    state[name] = action.payload
  }
}

function updateField(name) {
  return (state, action) => {
    if (exists(state[name]) && isPlainObject(state[name])) {
      state[name] = Object.assign({}, state[name], action.payload)
    } else {
      setField(name)(state, action)
    }
  }
}

function resetField(name, defaultValue = null) {
  return state => {
    state[name] = defaultValue
  }
}

function addItem(idField = 'id') {
  return (state, action) => {
    const id = action.payload[idField]
    state[id] = omitOne(action.payload, idField)
    return state
  }
}

function addItems(idField) {
  const addItem$ = addItem(idField)
  return (state, action) => {
    action.payload.reduce((prev, payload) => addItem$(prev, { payload }), state)
  }
}

function updateItem(idField = 'id') {
  return (state, action) => {
    const id = action.payload[idField]
    if (exists(state[id]) && isPlainObject(state[id])) {
      state[id] = Object.assign({}, state[id], omitOne(action.payload, idField))
      return state
    }
    return addItem(idField)(state, action)
  }
}

function updateItems(idField) {
  const updateItem$ = updateItem(idField)
  return (state, action) => {
    action.payload.reduce(
      (prev, payload) => updateItem$(prev, { payload }),
      state
    )
  }
}

function removeItem(idField = 'id') {
  return (state, action) => {
    const id = action.payload[idField]
    delete state[id]
    return state
  }
}

function removeItems(idField) {
  const removeItem$ = removeItem(idField)
  return (state, action) => {
    action.payload.reduce(
      (prev, payload) => removeItem$(prev, { payload }),
      state
    )
  }
}

function resetItems() {
  return () => ({})
}

function createAction(type) {
  return (payload, meta) => ({ type, payload, meta })
}

const FIELD_MAP = {
  SET_: setField,
  UPDATE_: updateField,
  RESET_: resetField,
}

function createFieldActionsMap(name, defaultValue) {
  return mapObj(FIELD_MAP, getFieldActionType(name), (key, value) =>
    value(name, defaultValue)
  )
}

function createGlobalActionsMap(defaults) {
  return Object.keys(defaults).reduce((sum, fieldName) => {
    const actionsMap = createFieldActionsMap(fieldName, defaults[fieldName])
    Object.assign(sum, actionsMap)
    return sum
  }, {})
}

const COLLECTION_MAP = {
  ADD_ITEM: addItem,
  ADD_ITEMS: addItems,
  UPDATE_ITEM: updateItem,
  UPDATE_ITEMS: updateItems,
  REMOVE_ITEM: removeItem,
  REMOVE_ITEMS: removeItems,
  RESET_ITEMS: resetItems,
}

function createCollectionActionsMap(manyName, idField, oneName) {
  return mapObj(
    COLLECTION_MAP,
    getCollectionActionType(manyName, oneName),
    (key, value) => value(idField)
  )
}

function createDefaultState(schema) {
  return mapObj(
    schema,
    undefined,
    (key, value) => (key === GLOBAL_KEY ? value : {})
  )
}

function createSchemadReducer(schema, createReducer) {
  const defaultState = createDefaultState(schema)
  return mapObj(schema, undefined, key =>
    createReducer(
      defaultState[key],
      key === GLOBAL_KEY
        ? createGlobalActionsMap(schema[key])
        : createCollectionActionsMap(
            key,
            getSchemaCollectionIdName(schema, key)
          )
    )
  )
}

function createActionTypes(schema) {
  const fieldVerbs = Object.keys(FIELD_MAP)
  const collectionVerbs = Object.keys(COLLECTION_MAP)
  return fromEntries(
    Object.keys(schema)
      .reduce(
        (prev, top) =>
          prev.concat(
            top === GLOBAL_KEY
              ? Object.keys(schema[top]).reduce(
                  (back, key) =>
                    back.concat(fieldVerbs.map(getFieldActionType(key))),
                  []
                )
              : collectionVerbs.map(getCollectionActionType(top))
          ),
        []
      )
      .map(type => [type, type])
  )
}

function createActions(schema) {
  return mapObj(
    createActionTypes(schema),
    type => snakeToCamel(type),
    type => createAction(type)
  )
}

function addErr(message, errKeys) {
  if (errKeys && errKeys.length) {
    return `${message}: ${errKeys.join(', ')}`
  }
  return null
}

function diffErr(prefix, xschema, xstate) {
  return [
    addErr(`${prefix} schema has extra keys`, diffKeys(xschema, xstate)),
    addErr(`${prefix} state has extra keys`, diffKeys(xstate, xschema)),
  ]
}

function verifyStateKeys(schema, state) {
  return Object.keys(schema)
    .reduce(
      (topPrev, topKey) =>
        topPrev.concat(
          topKey === GLOBAL_KEY
            ? diffErr('"global"', schema[topKey], state[topKey])
            : Object.keys(state[topKey]).reduce(
                (prev, id) =>
                  prev.concat(
                    diffErr(
                      `"${topKey}.${id}"`,
                      getSchemaCollectionFields(schema, topKey),
                      state[topKey][id]
                    )
                  ),
                []
              )
        ),
      diffErr('Top', schema, state)
    )
    .filter(Boolean)
}

/* eslint-disable no-console */
function verifyStateKeysMiddleware(schema) {
  return store => next => action => {
    const result = next(action)
    const errors = verifyStateKeys(schema, store.getState())
    if (errors.length) console.error(errors.join('\n'))
    return result
  }
}
/* eslint-enable */

module.exports = {
  mapObj,
  setField,
  updateField,
  resetField,
  addItem,
  addItems,
  updateItem,
  updateItems,
  removeItem,
  removeItems,
  resetItems,
  createAction,
  createFieldActionsMap,
  createGlobalActionsMap,
  createCollectionActionsMap,
  createDefaultState,
  createSchemadReducer,
  createActionTypes,
  createActions,
  verifyStateKeys,
  verifyStateKeysMiddleware,
}
