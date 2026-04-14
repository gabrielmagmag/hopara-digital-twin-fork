import React, {useMemo} from 'react'
import {PureComponent} from '@hopara/design-system'
import Ajv from 'ajv'
import {JsonEditor} from '@hopara/design-system/src/code-editor/JsonEditor'
import {i18n} from '@hopara/i18n'
import Visualization, {VisualizationType} from '../../visualization/Visualization'
import {PanelTitleBar} from '@hopara/design-system/src/panel/PanelTitleBar'
import {Store} from '../../state/Store'
import {SettingsMenuItemId} from '../SettingsMenu'
import actions from '../../state/Actions'
import {connect} from '@hopara/state'
import Case from 'case'
import {concat} from 'lodash/fp'
import {Dispatch} from '@reduxjs/toolkit'
import {SubPanel, SubPanelWrapper} from '@hopara/design-system/src/panel/SubPanel'
import {notExistsToUndefined} from './NotExistsToUndefined'

export interface StateProps {
  visualizationId?: string
  obj: any;
  schema: any;
  visualizationVersion: string;
}

export interface ActionProps {
  onChange: (visualization: Partial<Visualization>) => void;
  onBackClick: () => void;
}

type Props = StateProps & ActionProps

const ajv = new Ajv({ discriminator: true })

export class GeneralAdvancedPanel extends PureComponent<Props, { hasError: boolean, renderVersion: number, visualizationVersion: string }> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      renderVersion: 0,
      visualizationVersion: '',
    }
  }

  codeChanged(newCode: string) {
    let parsedObj: any
    let forceRerender = false

    try {
      parsedObj = JSON.parse(newCode)
      if (this.props.visualizationId && this.props.visualizationId !== parsedObj.id) forceRerender = true
      parsedObj.id = this.props.visualizationId
    } catch {
      this.setState({hasError: true})
      return
    }

    const valid = ajv.validate(this.props.schema, parsedObj)
    const renderVersion = forceRerender ? this.state.renderVersion + 1 : this.state.renderVersion

    if (valid) {
      this.setState({hasError: false, renderVersion}, () => {
        this.props.onChange(parsedObj)
      })
    } else {
      this.setState({hasError: true, renderVersion})
    }
  }

  componentDidUpdate(): void {
    if (this.props.visualizationVersion) {
      this.setState({visualizationVersion: this.props.visualizationVersion})
    }
  }

  render() {
    const json = JSON.stringify(this.props.obj, null, 2)

    return (
      <SubPanelWrapper>
        <SubPanel
          header={<PanelTitleBar
            title={i18n('ADVANCED_MODE')}
            onBackClick={this.props.onBackClick}
          />}
        >
            <JsonEditor
              key={this.state.renderVersion + this.state.visualizationVersion}
              value={json}
              onChange={(newCode) => this.codeChanged(newCode)}
              schema={this.props.schema}
              error={this.state.hasError ? i18n('INVALID_VISUALIZATION') : undefined}
          />
        </SubPanel>
      </SubPanelWrapper>
    )
  }
}

const typeToSchema = {
  [VisualizationType.GEO]: 'GeoVisualization',
  [VisualizationType.CHART]: 'ChartVisualization',
  [VisualizationType.THREE_D]: 'ThreeDVisualization',
  [VisualizationType.WHITEBOARD]: 'WhiteboardVisualization',
  [VisualizationType.ISOMETRIC_WHITEBOARD]: 'IsometricWhiteboardVisualization',

}

const visualizationProperties = ['id', 'mapStyle', 'refreshPeriod', 'encodingScope', 'autoNavigation', 
                                 'scope', 'historyBack', 'animationFps', 'bleedFactor', 'backgroundColor']

function mapState(state: Store): StateProps {
  const visualization = state.visualizationStore.visualization
  const viewState = state.viewState
  const discarded = state.visualizationStore.editStatus === 'DISCARDED'
  const visualizationVersion = useMemo(() => discarded ? Date.now().toString() : '', [discarded])

  const viewStateProperties = ['initialPosition', 'zoomRange', 'zoomBehavior']
  const properties = concat(visualizationProperties, viewStateProperties)

  const obj: Record<string, any> = {}

  visualizationProperties.forEach((key) => obj[key] = visualization[key])
  viewStateProperties.forEach((key) => obj[key] = viewState![key])

  const schema = useMemo(() => {
    const schema = Object.assign({}, state.schema.definitions[typeToSchema[visualization.type]])
    delete schema.required
    schema.definitions = JSON.parse(JSON.stringify(state.schema.definitions))
    schema.properties = Object.fromEntries(Object
      .entries(schema.properties)
      .filter(([key]) => {
        return properties.includes(key)
      })
      .map(([key]) => {
        const property = schema.properties[key]
        const isRef = property.$ref
        return [key, isRef ? state.schema.definitions[Case.pascal(key)] : property]
      }))
    return schema
  }, [visualization.type])

  return {
    visualizationId: visualization.id,
    obj,
    schema,
    visualizationVersion,
  }
}

function mapActions(dispatch: Dispatch): ActionProps {
  return {
    onChange: (parsedObj: any): void => { // For the removal of fields to work
      dispatch(actions.visualization.edited({change: notExistsToUndefined(parsedObj, visualizationProperties)}))
    },
    onBackClick: (): void => {
      dispatch(actions.visualization.advancedModeClicked({area: SettingsMenuItemId.GENERAL, enabled: false}))
    },
  }
}

export const GeneralAdvancedPanelContainer = connect<StateProps, ActionProps>(mapState, mapActions)(GeneralAdvancedPanel)

