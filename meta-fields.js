"use strict";

/*  ------------------------------------------------------------------------ */

    const O = Object

/*  ------------------------------------------------------------------------ */

    const pickFields = (obj, predicate) => {

        const result = {}

        for (let k of Object.getOwnPropertyNames (obj)) {
            const v = obj[k]
            if (predicate (k, v)) { result[k] = v }
        }

        return result
    }

/*  ------------------------------------------------------------------------ */

    class Meta {

        constructor (x) {

            this.assign (x)
        }

        assign (x) {

            if ('wrapped' in x) { this.wrapped = x.wrapped }

            this.__meta__ = x.__meta__ || {}

            return this
        }

        [Symbol.for ('String.ify')] (stringify) {

            if (stringify.json) {

                return stringify (this.wrapped)
            }

            let left = ''
            let numMeta = 0

            for (let tag in this.__meta__) {

                const name = '$' + tag
                const value = this.__meta__[tag]

                left = (typeof value === 'boolean')
                            ? (name + ' (' + left)
                            : (name + ' (' + stringify.configure ({ pretty: false }) (value) + ', ' + left)

                numMeta++
            }

            const bullet = require ('string.bullet')

            return bullet (left, stringify (this.wrapped)) + ')'.repeat (numMeta)
        }
    }

/*  ------------------------------------------------------------------------ */

    module.exports = O.assign (Meta, {

        new: x => new Meta (x),

        coerce: function (x) { return Meta.is (x) ? x : Meta.new ((arguments.length > 0) ? { wrapped: x } : {}) },

        assign: (x, fields) => (Meta.new (Meta.is (x) ? x : { wrapped: x })).assign (fields),

        is: x => (x && (x['__meta__'] !== undefined)) || false,

        hasValue: x => ('wrapped' in Meta.coerce (x)),

        unwrap: x => Meta.coerce (x).wrapped,

        hasTag: (obj, tag) => Meta.is (obj) && (tag in obj.__meta__),

        readTag: (obj, tag) => Meta.is (obj) ? obj.__meta__[tag] : undefined,

        tags: x => Meta.coerce (x).__meta__,

        eachTag: (x, fn) => {
            const tags = Meta.tags (x)
            for (let i in tags) { fn (i, tags[i]) }
        },

        replaceTags: (x, tags) => Meta.assign (x, { __meta__: tags }),

        setTags: (x, tags) => Meta.replaceTags (x, O.assign ({}, Meta.tags (x), tags)),

        setTag: (name, data, ...toWhat) => Meta.setTags (Meta.coerce (...toWhat), { [name]: data }),

        merge: (a, b) => (Meta.is (a) || Meta.is (b))
                            ? Meta.replaceTags (b, O.assign ({}, Meta.tags (a), Meta.tags (b)))
                            : b,

        omitTags (x, ...names) {

            if (!Meta.is (x)) { return x }

            const $names = new Set (names)

            return Meta.replaceTags (x, pickFields (x.__meta__, k => !$names.has (k)))
        },

        modify: (x, fn) => Meta.merge (x, fn (Meta.unwrap (x))),

        tag: (k, impl) => {

            const defaultImpl = (...args) => (args.length < 2)
                                                ? Meta.setTag (k, true, ...args) // $tag (value)
                                                : Meta.setTag (k,       ...args) // $tag (data, value)

            return O.assign ((typeof impl === 'function') ? impl.bind (null, k) : defaultImpl, {

               tagName: k,
                  read: x =>  Meta.readTag (x, k),
                    is: x =>  Meta.hasTag  (x, k),
                 isNot: x => !Meta.hasTag  (x, k),
            })
        },

        globalTag: (name, ...args) => {

            const isBrowser = (typeof window !== 'undefined') && (window.window === window) && window.navigator,
                  globalNamespace = isBrowser ? window : global

            return globalNamespace['$' + name] || (globalNamespace['$' + name] = Meta.tag (name, ...args))
        },
    })

/*  ------------------------------------------------------------------------ */


