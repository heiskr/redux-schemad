const { expect } = require('chai')
const sinon = require('sinon')
const {
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
} = require('./index')

const testSchema = {
  fieldRd: field([isRequired], 'abcd1234'),
  fieldR: field([isRequired]),
  fieldD: field([], 'abcd1234'),
  fieldN: field([]),
  embedN: embed({
    fieldEr: field([isRequired]),
    fieldEd: field([], 'abcd1234'),
    fieldEn: field([]),
  }),
  embedManyN: embedMany('fieldEmnId', {
    fieldEmnId: field([isRequired]),
    fieldEmn: field([]),
  }),
}

describe('redux-schemad', () => {
  describe('#field', () => {
    it('should create a field', () => {
      expect(field([], 1)).keys([
        '__field',
        'rules',
        'defaultValue',
      ])
    })
  })

  describe('#embed', () => {
    it('should create an embed', () => {
      expect(embed({})).keys([
        '__embed',
        'fields',
      ])
    })
  })

  describe('#embedMany', () => {
    it('should create an embedMany', () => {
      expect(embedMany('', {})).keys([
        '__embedMany',
        'onField',
        'fields',
      ])
    })
  })

  describe('#titleize', () => {
    it('should titleize a camelcase string', () => {
      expect(titleize('aCamelCaseString')).equal('A_CAMEL_CASE_STRING')
    })
  })

  describe('#ucfirst', () => {
    it('should ucfirst a string', () => {
      expect(ucfirst('aa')).equal('Aa')
    })
  })

  describe('#exists', () => {
    it('should test var is not undefined or null', () => {
      expect(exists(undefined)).false
      expect(exists(null)).false
      expect(exists('')).true
      expect(exists(0)).true
      expect(exists(false)).true
    })
  })

  describe('#omit', () => {
    it('should skip a key in an object', () => {
      expect(omit({ a: 1, b: 2 }, 'a')).deep.equal({ b: 2})
    })
  })

  describe('#createDefaultState', () => {
    it('should create a default store with field, embed, and embedMany', () => {
      const defaultState = createDefaultState(testSchema)
      expect(defaultState).deep.equal({
        fieldRd: 'abcd1234',
        fieldR: null,
        fieldD: 'abcd1234',
        fieldN: null,
        embedN: {
          fieldEd: 'abcd1234',
          fieldEn: null,
          fieldEr: null,
        },
        embedManyN: {},
      })
    })
  })

  describe('#createAction', () => {
    it('should create an action creator', () => {
      const dispatch = sinon.stub().returnsArg(0)
      const type = 'SET_NAME'
      const verb = 'set'
      const name = 'name'
      const payload = {}
      const fn = createAction({ type, verb, name, dispatch })
      expect(fn).a('function')
      const action = fn(payload)
      expect(dispatch.called).true
      expect(action.type).equal('SET_NAME')
    })
  })

  describe('#createBatchActions', () => {
    it('should create four action creators per field', () => {
      const dispatch = sinon.stub().returnsArg(0)
      const name = 'processId'
      const [actions, actionTypes] = createBatchActions(name, dispatch)
      expect(actionTypes).keys([
        'SET_PROCESS_ID',
        'UPDATE_PROCESS_ID',
        'CLEAR_PROCESS_ID',
        'RESET_PROCESS_ID',
      ])
    })
  })

  describe('#createEmbedManyActions', () => {
    it('should create eight action creators per field', () => {
      const dispatch = sinon.stub().returnsArg(0)
      const name = 'users'
      const [actions, actionTypes] = createEmbedManyActions(name, dispatch)
      expect(actionTypes).keys([
        'SET_USER',
        'UPDATE_USER',
        'CLEAR_USER',
        'RESET_USER',
        'SET_USERS',
        'UPDATE_USERS',
        'CLEAR_USERS',
        'RESET_USERS',
      ])
    })
  })

  describe('#createActions', () => {
    it('should create actions for fields, embed, and embedMany', () => {
      const dispatch = sinon.spy()
      const schema = testSchema
      const [actions, actionTypes] = createActions(schema, dispatch)
      expect(actionTypes).keys([
        'CLEAR_EMBED_MANY_N',
        'CLEAR_EMBED_N',
        'CLEAR_FIELD_D',
        'CLEAR_FIELD_N',
        'CLEAR_FIELD_R',
        'CLEAR_FIELD_RD',
        'RESET_EMBED_MANY_N',
        'RESET_EMBED_N',
        'RESET_FIELD_D',
        'RESET_FIELD_N',
        'RESET_FIELD_R',
        'RESET_FIELD_RD',
        'SET_EMBED_MANY_N',
        'SET_EMBED_N',
        'SET_FIELD_D',
        'SET_FIELD_N',
        'SET_FIELD_R',
        'SET_FIELD_RD',
        'UPDATE_EMBED_MANY_N',
        'UPDATE_EMBED_N',
        'UPDATE_FIELD_D',
        'UPDATE_FIELD_N',
        'UPDATE_FIELD_R',
        'UPDATE_FIELD_RD',
      ])
      expect(actions).keys([
        'clearEmbedManyN',
        'clearEmbedN',
        'clearFieldD',
        'clearFieldN',
        'clearFieldR',
        'clearFieldRd',
        'resetEmbedManyN',
        'resetEmbedN',
        'resetFieldD',
        'resetFieldN',
        'resetFieldR',
        'resetFieldRd',
        'setEmbedManyN',
        'setEmbedN',
        'setFieldD',
        'setFieldN',
        'setFieldR',
        'setFieldRd',
        'updateEmbedManyN',
        'updateEmbedN',
        'updateFieldD',
        'updateFieldN',
        'updateFieldR',
        'updateFieldRd',
      ])
    })
  })

  describe('#findErrors', () => {
    it('should find errors for fields', () => {
      const testState = {
        fieldRd: null,
        fieldR: null,
        fieldD: null,
        fieldN: null,
        embedN: {
          fieldEd: 'abcd1234',
          fieldEr: 'abcd1234',
        },
      }
      const errors = findErrors(testSchema, testState)
      expect(errors).length(2)
    })

    it('should find errors for embeds', () => {
       const testState = {
        fieldRd: 'abcd1234',
        fieldR: 'abcd1234',
        fieldD: 'abcd1234',
        embedN: {
        },
        embedManyN: {},
      }
      const errors = findErrors(testSchema, testState)
      expect(errors).length(1)
    })

    it('should find errors for embedMany', () => {
       const testState = {
        fieldRd: 'abcd1234',
        fieldR: 'abcd1234',
        fieldD: 'abcd1234',
        embedN: {
          fieldEd: 'abcd1234',
          fieldEr: 'abcd1234',
        },
        embedManyN: {
          abcd1234: {
            fieldEmnId: null,
          },
        },
      }
      const errors = findErrors(testSchema, testState)
      expect(errors).length(1)
    })
  })

  describe('#getNewReducerState', () => {
    describe('field', () => {
      it('should set', () => {
        const state = { foo: 'baz' }
        const f = field([])
        const name = 'foo'
        const verb = 'set'
        const payload = 'bar'
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foo: 'bar' })
      })

      it('should update', () => {
        const state = { foo: 'baz' }
        const f = field([])
        const name = 'foo'
        const verb = 'update'
        const payload = 'bar'
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foo: 'bar' })
      })

      it('should update field object', () => {
        const state = { foo: { a: 1, b: 2 } }
        const f = field([])
        const name = 'foo'
        const verb = 'update'
        const payload = { a: 3, c: 5 }
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foo: { a: 3, b: 2, c: 5 } })
      })

      it('should reset', () => {
        const state = { foo: 'baz' }
        const f = field([], 'abcd')
        const name = 'foo'
        const verb = 'reset'
        const newState = getNewReducerState(state, f, { name, verb })
        expect(newState).deep.equal({ foo: 'abcd' })
      })

      it('should clear', () => {
        const state = { foo: 'baz' }
        const f = field([], 'abcd')
        const name = 'foo'
        const verb = 'clear'
        const newState = getNewReducerState(state, f, { name, verb })
        expect(newState).deep.equal({ foo: null })
      })
    })

    describe('embed', () => {
      it('should set', () => {
        const state = { foo: { sub: 'baz', me: 'too' } }
        const f = embed({
          sub: field([], 'abcd'),
          me: field([]),
        })
        const name = 'foo'
        const verb = 'set'
        const payload = { sub: 'bar' }
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foo: { sub: 'bar' } })
      })

      it('should update', () => {
        const state = { foo: { sub: 'baz', me: 'too' } }
        const f = embed({
          sub: field([], 'abcd'),
          me: field([]),
        })
        const name = 'foo'
        const verb = 'update'
        const payload = { sub: 'bar' }
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foo: { sub: 'bar', me: 'too' } })
      })

      it('should reset', () => {
        const state = { foo: { sub: 'baz', me: 'too' } }
        const f = embed({
          sub: field([], 'abcd'),
          me: field([]),
        })
        const name = 'foo'
        const verb = 'reset'
        const payload = null
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foo: { sub: 'abcd', me: null } })
      })

      it('should clear', () => {
        const state = { foo: { sub: 'baz', me: 'too' } }
        const f = embed({
          sub: field([], 'abcd'),
          me: field([]),
        })
        const name = 'foo'
        const verb = 'clear'
        const payload = null
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foo: {} })
      })
    })

    describe('embedMany (all)', () => {
      it('should set', () => {
        const state = { foos: { qwer: { id: 'qwer', name: 'qwer' } } }
        const f = embedMany('id', {
          id: field([], 'abcd'),
          name: field([]),
        })
        const name = 'foos'
        const verb = 'set'
        const payload = { abcd: { id: 'abcd', name: 'abcd'} }
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foos: {
          abcd: { id: 'abcd', name: 'abcd' }
        } })
      })

      it('should update', () => {
        const state = { foos: { qwer: { id: 'qwer', name: 'qwer' } } }
        const f = embedMany('id', {
          id: field([], 'abcd'),
          name: field([]),
        })
        const name = 'foos'
        const verb = 'update'
        const payload = {
          abcd: { id: 'abcd', name: 'abcd'},
        }
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foos: {
          qwer: { id: 'qwer', name: 'qwer' },
          abcd: { id: 'abcd', name: 'abcd' }
        } })
      })

      it('should reset', () => {
        const state = { foos: { qwer: { id: 'qwer', name: 'qwer' } } }
        const f = embedMany('id', {
          id: field([], 'abcd'),
          name: field([]),
        })
        const name = 'foos'
        const verb = 'reset'
        const payload = null
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foos: {} })
      })

      it('should clear', () => {
        const state = { foos: { qwer: { id: 'qwer', name: 'qwer' } } }
        const f = embedMany('id', {
          id: field([], 'abcd'),
          name: field([]),
        })
        const name = 'foos'
        const verb = 'clear'
        const payload = null
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foos: {} })
      })
    })

    describe('embedMany (one)', () => {
      it('should set', () => {
        const state = { foos: { qwer: { id: 'qwer', name: 'qwer' } } }
        const f = embedMany('id', {
          id: field([]),
          name: field([]),
        })
        const name = 'foo'
        const verb = 'set'
        const payload = { id: 'abcd', name: 'abcd'}
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foos: {
          qwer: { id: 'qwer', name: 'qwer' },
          abcd: { id: 'abcd', name: 'abcd' }
        } })
      })

      it('should update', () => {
        const state = { foos: {
          abcd: { id: 'abcd', name: 'abcd' },
          qwer: { id: 'qwer', name: 'qwer' },
        } }
        const f = embedMany('id', {
          id: field([]),
          name: field([]),
        })
        const name = 'foo'
        const verb = 'set'
        const payload = { id: 'qwer', name: 'asdf' }
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foos: {
          abcd: { id: 'abcd', name: 'abcd' },
          qwer: { id: 'qwer', name: 'asdf' },
        } })
      })

      it('should reset', () => {
        const state = { foos: {
          qwer: { id: 'qwer', name: 'qwer' },
          abcd: { id: 'abcd', name: 'abcd' },
        } }
        const f = embedMany('id', {
          id: field([]),
          name: field([], 'adsf'),
        })
        const name = 'foo'
        const verb = 'reset'
        const payload = { id: 'qwer' }
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foos: {
          qwer: { id: 'qwer', name: 'adsf' },
          abcd: { id: 'abcd', name: 'abcd' }
        } })
      })

      it('should clear', () => {
        const state = { foos: {
          qwer: { id: 'qwer', name: 'qwer' },
          abcd: { id: 'abcd', name: 'abcd' },
        } }
        const f = embedMany('id', {
          id: field([]),
          name: field([]),
        })
        const name = 'foo'
        const verb = 'clear'
        const payload = { id: 'qwer' }
        const newState = getNewReducerState(state, f, { name, verb, payload })
        expect(newState).deep.equal({ foos: {
          abcd: { id: 'abcd', name: 'abcd' }
        } })
      })
    })
  })

  describe('#createReducer', () => {
    it('should skip actions without type, name, or verb', () => {
      const defaultState = createDefaultState(testSchema)
      const reducer = createReducer(defaultState, testSchema)
      const state = defaultState
      const action = {}
      const newState = reducer(state, action)
      expect(newState).equal(state)
    })

    it('should skip actions on non-members', () => {
      const defaultState = createDefaultState(testSchema)
      const reducer = createReducer(defaultState, testSchema)
      const state = defaultState
      const action = {
        type: 'SET_FOO',
        name: 'foo',
        verb: 'set',
        payload: {},
      }
      const newState = reducer(state, action)
      expect(newState).equal(state)
    })

    it('should not update state if errors', () => {
      const schema = {
        fieldR: field([isRequired])
      }
      const defaultState = createDefaultState(schema)
      const reducer = createReducer(defaultState, schema)
      const state = defaultState
      const action = {
        type: 'SET_FIELD_R',
        name: 'fieldR',
        verb: 'set',
        payload: null,
      }
      const newState = reducer(state, action)
      expect(newState).equal(state)
    })

    it('should update state if not errors', () => {
      const schema = {
        fieldR: field([isRequired])
      }
      const defaultState = createDefaultState(schema)
      const reducer = createReducer(defaultState, schema)
      const state = defaultState
      const action = {
        type: 'SET_FIELD_R',
        name: 'fieldR',
        verb: 'set',
        payload: 'Hello!',
      }
      const newState = reducer(state, action)
      expect(newState).not.equal(state)
    })
  })

  describe('#createFromSchema', () => {
    it('should create actions, actionTypes, defaultState, and reducer', () => {
      const schema = testSchema
      const dispatch = sinon.spy()
      const {
        actions,
        actionTypes,
        defaultState,
        reducer,
      } = createFromSchema({ schema, dispatch })
      expect(actions).an('object')
      expect(actionTypes).an('object')
      expect(defaultState).an('object')
      expect(reducer).a('function')
    })
  })
})

describe('redux-schemad validations', () => {
  describe('#isRequired', () => {
    it('should string on non-value', () => {
      expect(isRequired(null)).a('string')
      expect(isRequired(undefined)).a('string')
    })

    it('should string on empty string', () => {
      expect(isRequired('')).a('string')
    })

    it('should null on value', () => {
      expect(isRequired(false)).null
      expect(isRequired('a')).null
    })
  })
})
