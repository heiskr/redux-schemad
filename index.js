const SET = 'SET'
const ADD = 'ADD'
const UPDATE = 'UPDATE'
const REMOVE = 'REMOVE'
const RESET = 'RESET'
const ONE = 'ONE'
const MANY = 'MANY'
const FIELD_VERBS = [SET, UPDATE, RESET]
const COLLECTION_VERBS = [
  [ADD, ONE],
  [ADD, MANY],
  [UPDATE, ONE],
  [UPDATE, MANY],
  [REMOVE, ONE],
  [REMOVE, MANY],
  [RESET, MANY],
]
const OBJ_CONST = {}.constructor

function field(rules, defaultValue) {
  return { __field: true, rules, defaultValue }
}

function collection(onField, fields) {
  return { __collection: true, onField, fields }
}

function ucfirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function titleize(cameled) {
  return cameled
    .replace(/\.?([A-Z]+)/g, (_, s) => `_${s.toLowerCase()}`)
    .replace(/^_/, '')
    .toUpperCase()
}

function exists(value) {
  return typeof value !== 'undefined' && value != null
}

function omit(obj, omitKey) {
  return Object.keys(obj).reduce((result, key) => {
    if (key !== omitKey) {
      result[key] = obj[key]
    }
    return result
  }, {})
}

function getFieldDefault(xfield) {
  if (xfield.__field) {
    return (exists(xfield.defaultValue) && xfield.defaultValue) || null
  } else if (xfield.__collection) {
    return {}
  }
  return null
}

function createDefaultState(schema) {
  return Object.keys(schema).reduce(
    (sum, name) =>
      Object.assign(sum, { [name]: getFieldDefault(schema[name]) }),
    {}
  )
}

function createAction(type, verb, name, quantity) {
  return (payload, meta = {}) => ({
    type,
    payload,
    meta: Object.assign({ verb, name, quantity }, meta),
  })
}

function createFieldActionTypes(name) {
  return FIELD_VERBS.map(verb => `${verb.toUpperCase()}_${titleize(name)}`)
}

function createFieldActions(name) {
  const types = createFieldActionTypes(name)
  return FIELD_VERBS.reduce(
    (sum, verb, i) =>
      Object.assign(sum, {
        [verb.toLowerCase() + ucfirst(name)]: createAction(
          types[i],
          verb,
          name
        ),
      }),
    {}
  )
}

function getPluralizedName(name, quantity) {
  return quantity === MANY ? name : name.replace(/s$/, '')
}

function createCollectionActionTypes(name) {
  return COLLECTION_VERBS.map(
    ([verb, quantity]) =>
      `${verb.toUpperCase()}_${titleize(getPluralizedName(name, quantity))}`
  )
}

function createCollectionActions(name) {
  const types = createCollectionActionTypes(name)
  return COLLECTION_VERBS.reduce(
    (sum, [verb, quantity], i) =>
      Object.assign(sum, {
        [verb.toLowerCase() +
        ucfirst(getPluralizedName(name, quantity))]: createAction(
          types[i],
          verb,
          name,
          quantity
        ),
      }),
    {}
  )
}

function createActionTypes(schema) {
  return Object.keys(schema)
    .reduce((prev, name) => {
      const xfield = schema[name]
      if (xfield.__field) {
        return prev.concat(createFieldActionTypes(name))
      }
      if (xfield.__collection) {
        return prev.concat(createCollectionActionTypes(name))
      }
      return prev
    }, [])
    .reduce((sum, type) => Object.assign(sum, { [type]: type }), {})
}

function createActions(schema) {
  return Object.keys(schema).reduce((sum, name) => {
    const xfield = schema[name]
    if (xfield.__field) {
      return Object.assign(sum, createFieldActions(name))
    }
    if (xfield.__collection) {
      return Object.assign(sum, createCollectionActions(name))
    }
    return sum
  }, {})
}

function findErrors(schema, state) {
  function _(subSchema, subState) {
    let errors = []
    Object.keys(subSchema).forEach(name => {
      const xfield = subSchema[name]
      if (xfield.__field) {
        const errorRule = xfield.rules.find(rule => rule(subState[name], state))
        if (errorRule) {
          errors.push(
            [errorRule(subState[name], state), name, subState[name]].join(' ')
          )
        }
      } else if (xfield.__collection) {
        errors = Object.keys(subState[name] || {}).reduce(
          (prev, id) => prev.concat(_(xfield.fields, subState[name][id])),
          errors
        )
      }
    })
    return errors
  }
  const errors = _(schema, state)
  if (errors.length) {
    /* eslint-disable no-console */
    console.warn(`Reducer Did Not Update: \n${errors.join('\n')}`)
    /* eslint-enable */
  }
  return errors
}

function setField(state, name, xfield, payload) {
  return Object.assign({}, state, { [name]: payload })
}

function updateField(state, name, xfield, payload) {
  if (exists(state[name]) && state[name].constructor === OBJ_CONST) {
    return Object.assign({}, state, {
      [name]: Object.assign({}, state[name], payload),
    })
  }
  return setField(state, name, xfield, payload)
}

function resetField(state, name, xfield) {
  return Object.assign({}, state, { [name]: getFieldDefault(xfield) })
}

function addChild(state, xfield, payload) {
  const id = payload[xfield.onField]
  return Object.assign({}, state, { [id]: payload })
}

function addChildren(state, xfield, payload) {
  return payload.reduce((prev, child) => addChild(prev, xfield, child), state)
}

function updateChild(state, xfield, payload) {
  const id = payload[xfield.onField]
  return Object.assign({}, state, {
    [id]: Object.assign({}, state[id], payload),
  })
}

function updateChildren(state, xfield, payload) {
  return payload.reduce(
    (prev, child) => updateChild(prev, xfield, child),
    state
  )
}

function removeChild(state, xfield, payload) {
  const id = payload[xfield.onField]
  return omit(state, id)
}

function removeChildren(state, xfield, payload) {
  return payload.reduce(
    (prev, child) => removeChild(prev, xfield, child),
    state
  )
}

function resetChildren() {
  return {}
}

const FIELD_MAP = {
  [SET]: setField,
  [UPDATE]: updateField,
  [RESET]: resetField,
}

function getNewFieldState({ state, xfield, name, payload, verb }) {
  const fn = FIELD_MAP[verb]
  if (fn) {
    return fn(state, name, xfield, payload)
  }
  return state
}

const COLLECTION_MAP = {
  [ONE]: {
    [ADD]: addChild,
    [UPDATE]: updateChild,
    [REMOVE]: removeChild,
  },
  [MANY]: {
    [ADD]: addChildren,
    [UPDATE]: updateChildren,
    [REMOVE]: removeChildren,
    [RESET]: resetChildren,
  },
}

function getNewCollectionState({ state, xfield, payload, verb, quantity }) {
  const fn = COLLECTION_MAP[quantity] && COLLECTION_MAP[quantity][verb]
  if (fn) {
    return fn(state, xfield, payload)
  }
  return state
}

function getNewReducerState(
  state,
  xfield,
  { payload, meta: { name, verb, quantity } }
) {
  if (xfield.__field) {
    return getNewFieldState({ state, xfield, name, payload, verb })
  }
  if (xfield.__collection) {
    return Object.assign({}, state, {
      [name]: getNewCollectionState({
        state: state[name],
        quantity,
        xfield,
        verb,
        payload,
      }),
    })
  }
  return state
}

function createReducer(schema) {
  const defaultState = createDefaultState(schema)
  return (state = defaultState, action = {}) => {
    const { type, meta: { name, verb } = {} } = action
    if (!type || !name || !verb) {
      return state
    }
    const xfield = schema[name]
    if (!xfield) {
      /* eslint-disable no-console */
      console.warn('No found schema field for', name)
      /* eslint-enable */
      return state
    }
    const newState = getNewReducerState(state, xfield, action)
    if (findErrors(schema, newState).length) {
      return state
    }
    return newState
  }
}

function isRequired(value) {
  if (!exists(value) || (typeof value === 'string' && !value)) {
    return 'isRequired'
  }
  return null
}

module.exports = {
  field,
  collection,
  getFieldDefault,
  createDefaultState,
  createActionTypes,
  createActions,
  findErrors,
  getNewReducerState,
  createReducer,
  isRequired,
}
