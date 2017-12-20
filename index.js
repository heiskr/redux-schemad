const set = 'set'
const update = 'update'
const clear = 'clear'
const reset = 'reset'
const verbs = [set, update, clear, reset]

function field(rules, defaultValue) {
  return { __field: true, rules, defaultValue }
}

function embed(fields) {
  return { __embed: true, fields }
}

function embedMany(onField, fields) {
  return { __embedMany: true, onField, fields }
}

function ucfirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function titleize(cameled) {
  return cameled
    .replace(
      /\.?([A-Z]+)/g,
      (_, s) => '_' + s.toLowerCase()
    )
    .replace(/^_/, '')
    .toUpperCase()
}

function exists(value) {
  return typeof value !== 'undefined' && value != null
}

function omit(obj, omitKey) {
  return Object.keys(obj).reduce((result, key) => {
    if(key !== omitKey) {
       result[key] = obj[key]
    }
    return result
  }, {})
}

function getFieldDefault(field) {
  return (exists(field.defaultValue) && field.defaultValue) || null
}

function createDefaultState(schema) {
  function _(sub) {
    return Object.keys(sub).reduce((sum, name) => {
      const field = sub[name]
      if (field.__field) {
        sum[name] = getFieldDefault(field)
      } else if (field.__embed) {
        sum[name] = _(sub[name].fields)
      } else if (field.__embedMany) {
        sum[name] = {}
      }
      return sum
    }, {})
  }
  return _(schema)
}

function createAction({ type, verb, name, dispatch }) {
  return function(payload) {
    return dispatch({ type, verb, name, payload })
  }
}

function createBatchActions(name, dispatch) {
  const actions = {}
  const actionTypes = {}
  verbs.forEach((verb) => {
    const type = verb.toUpperCase() + '_' + titleize(name)
    actions[verb + ucfirst(name)] = createAction({ type, verb, name, dispatch })
    actionTypes[type] = type
  })
  return [actions, actionTypes]
}

function createEmbedManyActions(name, dispatch) {
  const actions = {}
  const actionTypes = {}
  const singularName = name.replace(/s$/, '')
  verbs.forEach((verb) => {
    const type = verb.toUpperCase() + '_' + titleize(name)
    actions[verb + ucfirst(name)] = createAction({ type, verb, name, dispatch })
    actionTypes[type] = type
    const singularType = verb.toUpperCase() + '_' + titleize(singularName)
    actions[verb + ucfirst(singularName)] = createAction({
      type: singularType, verb, name: singularName, dispatch
    })
    actionTypes[singularType] = singularType
  })
  return [actions, actionTypes]
}

function createActions(schema, dispatch) {
  let actions = {}
  let actionTypes = {}
  Object.keys(schema).forEach((name) => {
    const field = schema[name]
    let _actions = {}
    let _actionTypes = {}
    if (field.__field || field.__embed) {
      [_actions, _actionTypes] = createBatchActions(name, dispatch)
    } else if (field.__embedMany) {
      [_actions, _actionTypes] = createEmbedManyActions(name, dispatch)
    }
    Object.assign(actions, _actions)
    Object.assign(actionTypes, _actionTypes)
  })
  return [actions, actionTypes]
}

function findErrors(schema, state) {
  function _(subSchema, subState) {
    let errors = []
    Object.keys(subSchema).forEach((name) => {
      const field = subSchema[name]
      if (field.__field) {
        const error = field.rules.find(rule => rule(subState[name]))
        if (error) {
          errors.push([error(subState[name]), name, subState[name]].join(' '))
        }
      } else if (field.__embed) {
        errors = errors.concat(_(field.fields, subState[name]))
      } else if (field.__embedMany) {
        errors = errors.concat(
          Object.keys(subState[name] || {}).map(
            id => _(field.fields, subState[name][id])
          )
        )
      }
    })
    return errors
  }
  const errors = _(schema, state)
  if (errors.length) {
    console.warn('Reducer Did Not Update: \n' + errors.join('\n'))
  }
  return errors
}

const objConst = {}.constructor

function getNewReducerState(state, field, { name, verb, payload }) {
  if (field.__field) {
    if (verb === set) {
      return Object.assign({}, state, { [name]: payload })
    } else if (verb === update) {
      if (state[name].constructor === objConst) {
        return Object.assign({}, state, { [name]: Object.assign({}, state[name] || {}, payload) })
      } else {
        return Object.assign({}, state, { [name]: payload })
      }
    } else if (verb === reset) {
      return Object.assign({}, state, { [name]: getFieldDefault(field) })
    } else if (verb === clear) {
      return Object.assign({}, state, { [name]: null })
    }
  } else if (field.__embed) {
    if (verb === set) {
      return Object.assign({}, state, { [name]: payload })
    } else if (verb === update) {
      return Object.assign({}, state, { [name]: Object.assign({}, state[name] || {}, payload) })
    } else if (verb === reset) {
      return Object.assign({}, state, { [name]: createDefaultState(field.fields) })
    } else if (verb === clear) {
      return Object.assign({}, state, { [name]: {} })
    }
  } else if (field.__embedMany && name.substr(-1) === 's') {
    if (verb === set) {
      return Object.assign({}, state, { [name]: payload })
    } else if (verb === update) {
      return Object.assign({}, state, { [name]: Object.assign({}, state[name] || {}, payload)  })
    } else if (verb === reset || verb === clear) {
      return Object.assign({}, state, { [name]: {} })
    }
  } else if (field.__embedMany) {
    const id = payload[field.onField]
    const allName = name + 's'
    if (verb === set) {
      return Object.assign({}, state, {
        [allName]: Object.assign(
          {},
          state[allName] || {},
          { [id]: payload }
        )
      })
    } else if (verb === update) {
      return Object.assign({}, state, {
        [allName]: Object.assign(
          {},
          state[allName] || {},
          { [id]: Object.assign({}, state[allName][id] || {}, payload) }
        )
      })
    } else if (verb === reset) {
      return Object.assign({}, state, {
        [allName]: Object.assign(
          {},
          omit(state[allName] || {}, id),
          { [id]: Object.assign({}, createDefaultState(field.fields), { id: id }) },
        )
      })
    } else if (verb === clear) {
      return Object.assign({}, state, {
        [allName]: omit(state[allName] || {}, id)
      })
    }
  }
}

function createReducer(defaultState, schema) {
  return function(state = defaultState, action = { type: '' }) {
    const { type, name, verb } = action
    const field = schema[name] || schema[name + 's']
    if (!type || !name || !verb) { return state }
    if (!field) {
      console.warn('No found schema field for', name)
      return state
    }
    const newState = getNewReducerState(state, field, action)
    if (findErrors(schema, newState).length) { return state }
    return newState
  }
}

function createFromSchema({ schema, dispatch }) {
  const [actions, actionTypes] = createActions(schema, dispatch)
  const defaultState = createDefaultState(schema)
  return {
    actions,
    actionTypes,
    defaultState,
    reducer: createReducer(defaultState, schema),
  }
}

/* ----------------------------------------------------------- */

function isRequired(value) {
  if (
    !exists(value) ||
    typeof value === 'string' && !value
  ) {
    return 'isRequired'
  }
  return null
}

module.exports = {
  field,
  embed,
  embedMany,
  titleize,
  ucfirst,
  exists,
  omit,
  createDefaultState,
  createAction,
  createBatchActions,
  createEmbedManyActions,
  createActions,
  findErrors,
  getNewReducerState,
  createReducer,
  createFromSchema,
  // ---
  isRequired,
}
