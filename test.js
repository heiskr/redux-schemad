const {
  createReducer,
  combineReducers,
} = require('@acemarke/redux-starter-kit')
const {
  mapObj,
  // setField,
  // updateField,
  resetField,
  addItem,
  // addItems,
  updateItem,
  // updateItems,
  removeItem,
  // removeItems,
  // resetItems,
  // createAction,
  // createFieldActionsMap,
  // createGlobalActionsMap,
  // createCollectionActionsMap,
  createDefaultState,
  createSchemadReducer,
  createActionTypes,
  createActions,
  verifyStateKeys,
  verifyStateKeysMiddleware,
} = require('./index')

describe('Redux Schemad', () => {
  const schema = {
    global: {
      loggedInUserId: 'erty1234',
      settings: {},
    },
    users: {
      '[id]': {
        id: '',
        name: 'tester',
      },
    },
  }
  const defaultState = createDefaultState(schema)
  const reducer = combineReducers(createSchemadReducer(schema, createReducer))
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
        const state = {
          ...defaultState,
          global: { loggedInUserId: 'erty1234', settings: null },
        }
        const action = actions.updateSettings({ email: false })
        expect(action).toMatchSnapshot()
        expect(reducer(state, action)).toMatchSnapshot()
      })

      test('5 reset a field', () => {
        const state = {
          ...defaultState,
          global: { loggedInUserId: 'abcd1234', settings: {} },
        }
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
          users: { abcd1234: {} },
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
          users: { abcd1234: {} },
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

  describe('5 Verify State', () => {
    const goodState = {
      global: {
        loggedInUserId: 'erty1234',
        settings: {},
      },
      users: {},
    }

    const badState = {
      global: {
        loggedInUserId: 'erty1234',
      },
      users: {
        a: {
          name: 'abcd',
          email: 'abcd@example.com',
        },
      },
      foo: {},
    }

    describe('1 verifyStateKeys', () => {
      test('1 it should not find any errors', () => {
        expect(verifyStateKeys(schema, goodState)).toHaveLength(0)
      })

      test('2 it should find all errors', () => {
        expect(verifyStateKeys(schema, badState)).toHaveLength(3)
      })
    })

    describe('2 verifyStateKeysMiddleware', () => {
      /* eslint-disable no-console */
      const prevErr = console.error

      beforeEach(() => {
        console.error = jest.fn()
      })

      afterEach(() => {
        console.error = prevErr
      })

      test('1 should not report errors', () => {
        const store = { getState: () => goodState }
        const next = jest.fn()
        const action = {}
        verifyStateKeysMiddleware(schema)(store)(next)(action)
        expect(console.error).not.toBeCalled()
      })

      test('2 should report errors', () => {
        const store = { getState: () => badState }
        const next = jest.fn()
        const action = {}
        verifyStateKeysMiddleware(schema)(store)(next)(action)
        expect(console.error).toMatchSnapshot()
      })
      /* eslint-enable */
    })
  })

  describe('6 Extras', () => {
    test('1 call other things...', () => {
      mapObj({})
      resetField()
      addItem()
      updateItem()
      removeItem()
    })
  })
})
