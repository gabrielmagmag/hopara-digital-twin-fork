import {Row} from '@hopara/dataset'
import {Action, ActionType, Trigger} from './Action'
import {CallbackFunction} from './ActionReducer'
import { testCondition } from '@hopara/encoding'

export interface ActionButton {
  title: string
  icon?: string
  enabled: boolean
  onClick: () => void
}

const createActionButton = (action: Action, registeredCallbacks: CallbackFunction[], onActionClick: (action: Action) => void): ActionButton => ({
  title: action.title,
  icon: action.icon,
  enabled: action.type !== ActionType.FUNCTION_CALLBACK ||
    action.type === ActionType.FUNCTION_CALLBACK && registeredCallbacks.some((callback) => callback.name === action.name),
  onClick: () => onActionClick(action),
})

export const createActionButtons = (
  row: Row | undefined, actions: Action[], registeredCallbacks: CallbackFunction[], onActionClick: (action: Action) => void,
): ActionButton[] => {
  if (!actions?.length) {
    return []
  }

  const availableActions = actions.filter((action) => (!action.trigger || action.trigger === Trigger.NONE) && 
                                                       testCondition(action.visible?.condition, row, true))
  return availableActions.map((action) => createActionButton(action, registeredCallbacks, onActionClick))
}
