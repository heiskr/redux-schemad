const {
  field,
  collection,
  // ucfirst,
  // titleize,
  // exists,
  // omit,
  // getFieldDefault,
  // createDefaultState,
  // createAction,
  // createFieldActions,
  // createCollectionActions,
  // createActions,
  // findErrors,
  // setField,
  // updateField,
  // resetField,
  // addChild,
  // addChildren,
  // updateChild,
  // updateChildren,
  // removeChild,
  // removeChildren,
  // resetChildren,
  // getNewFieldState,
  // getNewCollectionState,
  // getNewReducerState,
  // createReducer,
  createFromSchema,
  // ---
  isRequired,
  // isReferencing,
} = require('./index')

describe('Redux Schemad', () => {
  const dispatch = a => a
  const schema = {
    loggedInUserId: field([], ''),
    settings: field([], {}),
    users: collection('id', {
      id: field([isRequired]),
      name: field([], 'tester'),
    }),
  }
  const { actions, actionTypes, defaultState, reducer } = createFromSchema({
    dispatch,
    schema,
  })

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

      test('2 update a field', () => {
        const action = actions.updateSettings({ email: false })
        expect(action).toMatchSnapshot()
        expect(reducer(defaultState, action)).toMatchSnapshot()
      })

      test('3 reset a field', () => {
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
})
