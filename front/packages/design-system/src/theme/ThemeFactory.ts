import { ThemeSpec } from './ThemeSpec'

export const ThemeFactoryToken = Symbol('ThemeFactory')

export interface ThemeFactory {
    getSpec: (tenant: string, mode: string) => ThemeSpec
}
