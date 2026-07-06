import {geti} from './Geti'

const VARIABLE_TOKEN_REGEX = /\$\{([A-Za-z_][A-Za-z0-9_.]*)\}/g

export function isFieldTemplate(field:string): boolean {
  return typeof field === 'string' && field.includes('${')
}

export function resolveTemplate(template: string, row: Record<string, unknown> = {}): string {
  return template.replace(VARIABLE_TOKEN_REGEX, (_, variableName) => {
    const value = geti(variableName, row)

    if (value === undefined || value === null) {
      return ''
    }

    return String(value)
  })
}
