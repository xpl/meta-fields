/*  ------------------------------------------------------------------------ */

const assert = (...args) => require ('assert')[(args.find (x => typeof x === 'object')) ? 'deepEqual' : 'equal'] (...args)

/*  ------------------------------------------------------------------------ */

describe ('meta-fields.js', () => {
    
    it ('Importing', () => {

        Meta = require ('./meta-fields')
    })

    it ('Defining tags', () => {

        $foo = Meta.tag ('foo'),
        $bar = Meta.tag ('bar')
    })

    it ("Defining tags in global namespace", () => {

        Meta.globalTag ('qux')
    })

    it ('Tag is a function, accepting random data', () => {

        $foo (42)           // returns 42 tagged with $foo
        $foo ($bar (42))    // returns 42 tagged with $foo and $bar
    })

    it ('It returns a wrapper holding the metadata and the original value', () => {

        const x = $foo (42)

        assert (Meta.is (x), true)

        assert (            x,   { wrapped: 42, __meta__: { foo: true } })
        assert (      $bar (x),  { wrapped: 42, __meta__: { foo: true, bar: true } })
        assert ($qux ($bar (x)), { wrapped: 42, __meta__: { foo: true, bar: true, qux: true } })
    })

    it ("Order/redundancy is irrelevant", () => {

        assert ($foo ($bar (42)), $bar ($foo ($foo (42))))
    })

    it ("Supplying additional metadata along with a tag", () => {

        assert ($foo ('some data', $bar (42)), { wrapped: 42, __meta__: { foo: 'some data', bar: true } })
    })

    it ("Explicit way of adding tags", () => {

        assert (Meta.setTags (42, { foo: true }), $foo (42))
    })

    it ("Accessing the original value", () => {

        assert (Meta.unwrap ($foo ($bar (42))), 42)
        assert (Meta.unwrap (42),               42)
    })

    it ("Modifying tagged value while keeping the original tags intact (can also add new tags this way)", () => {

        assert (Meta.modify (      42,  x =>       x + 1),              43)
        assert (Meta.modify ($foo (42), x =>       x + 1),  $foo (      43))
        assert (Meta.modify ($foo (42), x => $bar (x + 1)), $foo ($bar (43)))
    })

    it ("Tagging 'nothing' is legal. And it is not the same as tagging 'undefined'...", () => {

        assert ($foo (),          { __meta__: { foo: true } })
        assert ($foo (undefined), { __meta__: { foo: true }, wrapped: undefined })

        assert (Meta.hasValue ($foo ())         , false)
        assert (Meta.hasValue ($foo (undefined)), true)
    })

    it ("Checking for a specific tag presence", () => {

        assert ($foo.is (      42),  false)
        assert ($foo.is ($foo (42)), true)
        assert ($foo.is ($bar (42)), false)

        assert (Meta.hasTag ($foo (42), 'foo'), true)
    })

    it ("Obtaining a value associated with a tag", () => {

        assert ($foo.read (              42),   undefined)
        assert ($foo.read ($foo (        42)),  true)
        assert ($foo.read ($foo ('data', 42)), 'data')

        assert (Meta.readTag ($foo ('data', 42), 'foo'), 'data')
    })

    it ("Getting all tags", () => {

        assert (Meta.tags ($foo ($bar ($qux (42)))), { 'qux': true, 'bar': true, 'foo': true })
        assert (Meta.tags (                  42),    {})
    })

    it ("Enumerating tags", () => {

        const calls = []

        Meta.eachTag ($foo ($bar ($qux (42))), (tag, value) => calls.push ([tag, value]))

        assert (calls, [['qux', true], ['bar', true], ['foo', true]])
    })

    it ("Removing tags", () => {

        assert (Meta.omitTags ($foo ($bar (7)), 'foo'), $bar ( 7))
        assert (Meta.omitTags (            7,   'foo'),        7)
    })

    it ("Using with string.ify (if available)", () => {

        const stringify = require ('string.ify'),
              pretty    = require ('string.ify').configure ({ pretty: true })

        assert (stringify ( { foo: $foo ($qux ({ bar: 7 }, 1)) }),
                           '{ foo: $foo ($qux ({ bar: 7 }, 1)) }')
        
        assert (pretty ( { foo: $foo ($qux ([ 7, 8 ])) }),

                        '{ foo: $foo ($qux ([ 7,'          + '\n' +
                        '                     8  ])) }')
    })

    it ('[BUG] pollution of __meta__', () => {

        const x = $foo (42)
        const y = $foo ({ customData: 'bug' }, x)

        assert (x, { wrapped: 42, __meta__: { foo: true } })
        assert (y, { wrapped: 42, __meta__: { foo: { customData: 'bug' } } })
    })

})
