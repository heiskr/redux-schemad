const {
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
} = require('./index')

describe('Redux Schemad', () => {
  const schema = {
    loggedInUserId: field([isRequired], 'erty1234'),
    settings: field([], {}),
    users: collection('id', {
      id: field([isRequired]),
      name: field([], 'tester'),
    }),
  }
  const defaultState = createDefaultState(schema)
  const reducer = createReducer(schema)
  const actions = createActions(schema)
  const actionTypes = createActionTypes(schema)

  describe('1 Actions', () => {
    test('match snapshot', () => {
      expect(Object.keys(actions)).toMatchSnapshot()
    })
  })

  describe('2 Action Types', () => {
    test('match snapshot', () => {
      expect(actionTypes).toMatchSnapshot()
    })
  })

  describe('3 Default State', () => {
    test('match snapshot', () => {
      expect(defaultState).toMatchSnapshot()
    })
  })

  describe('4 Reducer', () => {
    describe('1 Field', () => {
      test('1 set a field', () => {
        const action = actions.setLoggedInUserId('abcd1234')
        expect(action).toMatchSnapshot()
        expect(reducer(defaultState, action)).toMatchSnapshot()
      })

      test('2 update a flat field', () => {
        const action = actions.updateLoggedInUserId('abcd1234')
        expect(action).toMatchSnapshot()
        expect(reducer(defaultState, action)).toMatchSnapshot()
      })

      test('3 update an object field', () => {
        const action = actions.updateSettings({ email: false })
        expect(action).toMatchSnapshot()
        expect(reducer(defaultState, action)).toMatchSnapshot()
      })

      test('4 update an object field not before though', () => {
        const state = { ...defaultState, settings: null }
        const action = actions.updateSettings({ email: false })
        expect(action).toMatchSnapshot()
        expect(reducer(state, action)).toMatchSnapshot()
      })

      test('5 reset a field', () => {
        const state = { ...defaultState, loggedInUserId: 'abcd1234' }
        const action = actions.resetLoggedInUserId()
        expect(action).toMatchSnapshot()
        expect(reducer(state, action)).toMatchSnapshot()
      })
    })

    describe('2 Collection', () => {
      test('1 add a child', () => {
        const action = actions.addUser({
          id: 'abcd1234',
        })
        expect(action).toMatchSnapshot()
        expect(reducer(defaultState, action)).toMatchSnapshot()
      })

      test('2 add many children', () => {
        const action = actions.addUsers([
          {
            id: 'abcd1234',
          },
          {
            id: 'wxyz0987',
          },
        ])
        expect(action).toMatchSnapshot()
        expect(reducer(defaultState, action)).toMatchSnapshot()
      })

      test('3 update a child', () => {
        const state = {
          ...defaultState,
          users: { abcd1234: { id: 'abcd1234' } },
        }
        const action = actions.updateUser({
          id: 'abcd1234',
          name: 'foobar',
        })
        expect(action).toMatchSnapshot()
        expect(reducer(state, action)).toMatchSnapshot()
      })

      test('4 update many children', () => {
        const state = {
          ...defaultState,
          users: { abcd1234: { id: 'abcd1234' } },
        }
        const action = actions.updateUsers([
          {
            id: 'abcd1234',
            name: 'foobar',
          },
          {
            id: 'wxyz0987',
          },
        ])
        expect(action).toMatchSnapshot()
        expect(reducer(state, action)).toMatchSnapshot()
      })

      test('5 remove a child', () => {
        const state = {
          ...defaultState,
          users: { abcd1234: { id: 'abcd1234' }, wxyz0987: { id: 'wxyz0987' } },
        }
        const action = actions.removeUser({
          id: 'abcd1234',
        })
        expect(action).toMatchSnapshot()
        expect(reducer(state, action)).toMatchSnapshot()
      })

      test('6 remove many children', () => {
        const state = {
          ...defaultState,
          users: { abcd1234: { id: 'abcd1234' }, wxyz0987: { id: 'wxyz0987' } },
        }
        const action = actions.removeUsers([
          {
            id: 'abcd1234',
          },
        ])
        expect(action).toMatchSnapshot()
        expect(reducer(state, action)).toMatchSnapshot()
      })

      test('7 reset the collection', () => {
        const state = {
          ...defaultState,
          users: { abcd1234: { id: 'abcd1234' } },
        }
        const action = actions.resetUsers()
        expect(action).toMatchSnapshot()
        expect(reducer(state, action)).toMatchSnapshot()
      })
    })
  })

  describe('5 Edges', () => {
    test('1 an action missing data', () => {
      expect(reducer()).toEqual(defaultState)
      expect(reducer(defaultState, {})).toEqual(defaultState)
      expect(
        reducer(defaultState, { type: 'FOO', meta: { name: 'FOO' } })
      ).toEqual(defaultState)
      expect(
        reducer(defaultState, { type: 'FOO', meta: { verb: 'FOO' } })
      ).toEqual(defaultState)
    })

    test('2 field not in schema', () => {
      const prevWarn = global.console.warn
      global.console.warn = jest.fn()
      expect(
        reducer(defaultState, {
          type: 'FOO',
          meta: { name: 'FOO', verb: 'FOO' },
        })
      ).toEqual(defaultState)
      expect(global.console.warn).toBeCalled()
      global.console.warn = prevWarn
    })

    test('3 invalid update', () => {
      const prevWarn = global.console.warn
      global.console.warn = jest.fn()
      const action = actions.setLoggedInUserId(null)
      expect(reducer(defaultState, action)).toEqual(defaultState)
      expect(global.console.warn).toBeCalled()
      global.console.warn = prevWarn
    })

    test('4 invalid field verb', () => {
      const action = actions.setLoggedInUserId('abcd1234')
      action.meta.verb = 'FOO'
      expect(reducer(defaultState, action)).toEqual(defaultState)
    })

    test('5 invalid field verb', () => {
      const action = actions.addUser({
        id: 'abcd1234',
      })
      action.meta.verb = 'FOO'
      expect(reducer(defaultState, action)).toEqual(defaultState)
    })

    test('6 call worthless back-ups', () => {
      expect(getNewReducerState({}, {}, { meta: {} })).toEqual({})
      expect(findErrors({ a: {} }, {})).toEqual([])
      expect(findErrors(schema, { ...defaultState, users: null })).toEqual([])
      expect(createActions({ a: {} })).toEqual({})
      expect(createActionTypes({ a: {} })).toEqual({})
      expect(getFieldDefault({})).toBe(null)
      expect(getFieldDefault({ __field: true })).toBe(null)
    })
  })
})
