const set = 'set'
const update = 'update'
const clear = 'clear'
const reset = 'reset'
const verbs = [set, update, clear, reset]

export function field(rules, defaultValue) {
  return { __field: true, rules, defaultValue }
}

export function embed(fields) {
  return { __embed: true, fields }
}

export function embedMany(onField, fields) {
  return { __embedMany: true, onField, fields }
}

export function titleize(cameled) {
  return cameled
    .replace(
      /\.?([A-Z]+)/g,
      (_, s) => '_' + s.toLowerCase()
    )
    .replace(/^_/, '')
    .toUpperCase()
}

export function exists(value) {
  return typeof value !== 'undefined' && value != null
}

export function omit(obj, omitKey) {
  return Object.keys(obj).reduce((result, key) => {
    if(key !== omitKey) {
       result[key] = obj[key]
    }
    return result
  }, {})
}

export function createDefaultState(schema) {
  function _(sub) {
    return Object.keys(sub).reduce((sum, name) => {
      const field = sub[name]
      if (field.__field) {
        sum[name] = (exists(field.defaultValue) && field.defaultValue) || null
      } else if (field.__embed) {
        sum[name] = _(sub[name])
      } else if (field.__embedMany) {
        sum[name] = {}
      }
      return sum
    }, {})
  }
  return _(schema)
}

export function createAction(verb, name, dispatch) {
  const type = verb.toUpperCase() + '_' + titleize(name)
  return function(payload) {
    return dispatch({ type, verb, name, payload })
  }
}

export function createBatchActions(name, dispatch) {
  const actions = {}
  const actionTypes = {}
  verbs.forEach((verb) => {
    actions[verb + ucfirst(name)] = createAction(verb, name, dispatch)
    actionTypes[type] = type
  })
  return [actions, actionTypes]
}

export function createEmbedManyActions(name, dispatch) {
  const actions = {}
  const actionTypes = {}
  const singularName = name.replace(/s$/, '')
  verbs.forEach((verb) => {
    actions[verb + ucfirst(name)] = createAction(verb, name, dispatch)
    actions[verb + ucfirst(singularName)] = createAction(verb, singularName, dispatch)
    actionTypes[type] = type
    actionTypes[singularType] = singularType
  })
  return [actions, actionTypes]
}

export function createActions(schema, dispatch) {
  let actions = {}
  let actionTypes = {}
  return Object.keys(sub).forEach((name) => {
    const field = sub[name]
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

export function findErrors(schema, state) {
  function _(subSchema, subState) {
    let errors = []
    Object.keys(subSchema).forEach((name) => {
      const field = subSchema[name]
      if (field.__field) {
        const error = field.rules.find(rule => rule(subState[name]))
        if (error) { errors.push([error, name, subState[name]]) }
      } else if (field.__embed) {
        errors = errors.concat(_(field.fields, subState[name]))
      } else if (field.__embedMany) {
        errors = errors.concat(Object.keys(subState[name] || {}).every(
          id => _(field.fields, subState[name][id])
        ))
      }
    })
    return errors
  }
  const errors = _(schema, state)
  if (errors.length) { console.warn(errors.join('\n')) }
  return errors
}

export function getNewReducerState(state, name, field, verb, payload) {
  if (field.__field) {
    if (verb === set) {
      return { ...state, [name]: payload }
    } else if (verb === update) {
      if (state[name].constructor === {}.constructor) {
        return { ...state, [name]: { ...(state[name] || {}), ...payload } }
      } else {
        return { ...state, [name]: payload }
      }
    } else if (verb === reset) {
      return { ...state, [name]: (exists(field.defaultValue) && field.defaultValue) || null }
    } else if (verb === clear) {
      return { ...state, [name]: null }
    }
  } else if (field.__embed) {
    if (verb === set) {
      return { ...state, [name]: payload}
    } else if (verb === update) {
      return { ...state, [name]: { ...(state[name] || {}), ...payload } }
    } else if (verb === reset) {
      return { ...state, [name]: createDefaultState(field.fields) }
    } else if (verb === clear) {
      return { ...state, [name]: {} }
    }
  } else if (field.__embedMany && name.substr(-1) === 's') {
    if (verb === set) {
      return { ...state, [name]: payload }
    } else if (verb === update) {
      return { ...state, [name]: { ...(state[name] || {}), ...payload } }
    } else if (verb === reset || verb === clear) {
      return { ...state, [name]: {},  }
    }
  } else if (field.__embedMany) {
    const id = payload[field.onField]
    if (verb === set) {
      return { ...state, [name]: { ...(state[name] || {}), [id]: payload } } }
    } else if (verb === update) {
      return { ...state, [name]: { ...(state[name] || {}), [id]: {
        ...(state[name][id] || {}),
        ...payload,
      } } }
    } else if (verb === reset || verb === clear) {
      return { ...state, [name]: omit(state[name] || {}, id) }
    }
  }
}

export function createReducer(defaultState, schema) {
  return function(state = defaultState, action = { type: '' }) {
    const { type, name, verb, payload } = action
    const field = schema[name] || schema[name + 's']
    if (!type || !name || !verb) { return state }
    if (!field) {
      console.warn('No found schema field for', name)
      return state
    }
    const newState = getNewReducerState(state, name, field, verb, payload)
    if (findErrors(schema, newState).length) { return state }
    return newState
  }
}

export function createFromSchema({ schema, dispatch }) {
  const [actions, actionTypes] = createActions(schema, dispatch)
  const defaultState = createDefaultState(schema)
  return {
    actions,
    actionTypes,
    defaultState,
    reducer: createReducer(defaultState, schema),
  }
}
