import { Draft } from 'immer'
import { atom, Getter, WritableAtom } from 'jotai'
import { withImmer } from 'jotai/immer'

/**
 * Creates a derived atom whose value is the picked object property.
 * By default, the setter acts as a primitive atom's, changing the original atom.
 * A custom setter may also be passed, which uses a draft (with immer) so that it can be mutated directly.
 */
export function pickAtom<Value, Key extends keyof Value, Slice extends Value[Key], Update>(
  anAtom: WritableAtom<Value, Value>,
  key: Key,
  setter: (draft: Draft<Slice>, update: Update, get: Getter) => Slice | void = (draft, update) => update
) {
  const getter = (value: Value) => value[key]
  return atom(
    (get) => getter(get(anAtom)),
    (get, set, update: Update) =>
      set(withImmer(anAtom), (value) => {
        const newSlice = setter(getter(value as Value) as Draft<Slice>, update, get)
        if (newSlice) {
          ;(value as Value)[key] = newSlice
        }
      })
  )
}

/**
 * Typing for a customizable enum; see setCustomizable.
 * This is not exported because an enum may not extend another interface.
 */
interface CustomizableEnum<T extends number> {
  CUSTOM: T
  DEFAULT: T
}

/**
 * Typing for a customizable enum; see setCustomizable.
 * The first value is used, unless it is CUSTOM, in which case the second is used.
 */
export type Customizable<T> = [T, number?]

/** Sets a customizable enum, validating the tuple and falling back to the default. */
export function setCustomizable<T extends number, Enum extends CustomizableEnum<T>>(customizable: Enum) {
  return (draft: Customizable<T>, update: Customizable<T> | T): void => {
    // normalize the update
    if (!Array.isArray(update)) {
      update = [update]
    }

    draft[0] = update[0]
    if (update.length === 2) {
      draft[1] = update[1]
    }

    // prevent invalid state
    if (draft[0] === customizable.CUSTOM && draft[1] === undefined) {
      draft[0] = customizable.DEFAULT
    }
    return
  }
}

/** Sets a togglable atom to invert its state at the next render. */
export function setTogglable(draft: boolean) {
  return !draft
}