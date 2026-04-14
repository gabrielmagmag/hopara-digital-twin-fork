import React from 'react'
import {PureComponent} from '../component/PureComponent'
import {debounce} from 'lodash/fp'
import Editor, {loader} from '@monaco-editor/react'
import {Theme, withTheme} from '../theme'
import {Box} from '@mui/material'
import {Icon} from '../icons/Icon'
import { Tooltip } from '../tooltip/Tooltip'

loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs',
  },
})

export enum CodeEditorFontSize {
  Small = 12,
  Medium = 14,
  Large = 16,
}

export interface CodeEditorProps {
  onChange: (value: any) => void
  onCtrlEnter?: () => void
  onCtrlS?: () => void
  value: any
  height?: number | string
  fontSize?: CodeEditorFontSize
  error?: string
}

interface Props extends CodeEditorProps {
  language?: string
  schema?: any
  error?: string
  theme: Theme
}

export const getMonacoTheme = (theme: Theme) => {
  const foregrounds = [{
    keys: ['keyword', 'keyword.json'],
    value: theme.palette.spec.primary,
  }, {
    keys: ['number'],
    value: theme.palette.spec.secondary,
  }, {
    keys: ['string.key.json'],
    value: theme.palette.spec.outline,
  }, {
    keys: ['string.value.json', 'string.sql'],
    value: theme.palette.spec.tertiary,
  }, {
    keys: ['predefined.sql'],
    value: theme.palette.spec.tonal.tertiary[50],
  }, {
    keys: ['comment'],
    value: theme.palette.spec.tonal.neutral[50],
  }, {
    keys: ['delimiter'],
    value: theme.palette.text.primary,
  },
  ]

  return {
    base: 'vs',
    inherit: true,
    rules: foregrounds.map(({keys, value}) =>
      keys.map((key) => ({token: key, foreground: value, fontSize: 40})),
    ).flat(),
    colors: {
      'editor.foreground': theme.palette.text.primary,
      'editor.background': theme.palette.spec.background,
      'editorCursor.foreground': theme.palette.text.primary,
      'editorLineNumber.foreground': theme.palette.spec.surfaceVariant,
      'editorLineNumber.activeForeground': theme.palette.text.primary,
      'editor.selectionBackground': theme.palette.spec.secondaryContainer,
      'editor.inactiveSelectionBackground': theme.palette.spec.secondaryContainer,
      'scrollbarSlider.background': theme.palette.text.secondary,
      'scrollbarSlider.hoverBackground': theme.palette.primary.main,
      'scrollbarSlider.activeBackground': theme.palette.primary.main,
      'editorIndentGuide.background': theme.palette.spec.surfaceVariant,
      'editor.lineHighlightBorder': '#00000000',
      'editor.lineHighlightBackground': theme.palette.spec.onSurface + '10',

      'editorSuggestWidget.background': theme.palette.spec.background,
      'editorSuggestWidget.border': theme.palette.spec.outline,
      'editorSuggestWidget.foreground': theme.palette.text.primary,
      'editorSuggestWidget.focusHighlightForeground': theme.palette.text.primary,
      'editorSuggestWidget.highlightForeground': theme.palette.text.primary,
      'editorSuggestWidget.selectedBackground': theme.palette.spec.primaryContainer,
      'editorSuggestWidget.selectedForeground': theme.palette.spec.onPrimaryContainer,
      'editorSuggestWidget.selectedIconForeground': theme.palette.spec.tertiary,
      'editorSuggestWidgetStatus.foreground': theme.palette.text.primary,

      'editorHoverWidget.foreground': theme.palette.text.primary,
      'editorHoverWidget.background': theme.palette.spec.background,
      'editorHoverWidget.border': theme.palette.spec.background,
      'editorHoverWidget.highlightForeground': theme.palette.text.primary,
      'editorHoverWidget.statusBarBackground': theme.palette.spec.background,

      'list.hoverForeground': theme.palette.spec.onSecondary,
      'list.hoverBackground': theme.palette.spec.secondaryContainer,
    },
  }
}


const notifyCodeChange = (code, props) => {
  props.onChange(code)
}
const debouncedNotify = debounce(500, notifyCodeChange)

type State = {
  code: string
}

export class CodeEditorComp extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {code: props.value}
  }

  codeChanged(code) {
    this.setState({code})
    debouncedNotify(code, this.props)
  }

  getCode() {
    return this.state.code
  }

  render() {
    return (
      <Box sx={{
        display: 'grid',
        gridTemplateAreas: '"stack"',
        height: '100%',
      }}>
        {this.props.error && <Tooltip title={this.props.error} placement="bottom">
          <Box
            sx={{
              'gridArea': 'stack',
              'zIndex': 1,
              'color': 'error.main',
              'cursor': 'help',
              'backgroundColor': this.props.theme.palette.spec.backgroundCanvasButton,
              'boxShadow': this.props.theme.palette.spec.shadowCanvasButton,
              'borderRadius': '100%',
              'padding': 2,
              'backdropFilter': this.props.theme.palette.spec.backgroundBlur,
              'width': 30,
              'height': 30,
              'display': 'grid',
              'placeItems': 'center',
              'justifySelf': 'end',
              'margin': '4px 12px 0 0',
              '&:hover': {
                'filter': 'brightness(1.8)',
              },
            }}
          >
            <Icon icon="alert"/>
          </Box>
        </Tooltip>
        }
        <Box sx={{
          'gridArea': 'stack',
          'width': '100%',
          'minWidth': 0,
          'minHeight': 0,
          'display': 'flex',
          'flexDirection': 'column',
          'position': 'relative',
        }}>
          <Editor
            defaultLanguage={this.props.language}
            value={this.getCode()}
            onChange={this.codeChanged.bind(this)}
            options={{
              minimap: {enabled: false},
              contextmenu: false,
              fontSize: this.props.fontSize ?? CodeEditorFontSize.Small,
              scrollBeyondLastLine: false,
              fixedOverflowWidgets: true,
              automaticLayout: true,
              scrollbar: {
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                vertical: 'visible',
                horizontal: 'visible',
                verticalScrollbarSize: 7,
                horizontalScrollbarSize: 7,
                arrowSize: 20,
              },
              padding: {
                top: 10,
                bottom: 10,
              },
            }}
            theme={'materialYou'}
            height="100%"
            beforeMount={(monaco) => {
              monaco.editor.defineTheme('materialYou', getMonacoTheme(this.props.theme))
              if (this.props.schema) {
                monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                  validate: true,
                  schemas: [
                    {
                      fileMatch: ['*'],
                      schema: this.props.schema,
                    },
                  ],
                })
              }
            }}
            onMount={(editor, monaco) => {
              if (this.props.onCtrlEnter) {
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                  this.props.onCtrlEnter!()
                })
              }
              if (this.props.onCtrlS) {
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.S, () => {
                  this.props.onCtrlS!()
                })
              }
            }}
          />
        </Box>
      </Box>
    )
  }
}

export const CodeEditor = withTheme<Props>(CodeEditorComp)
