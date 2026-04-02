import { ThemeFactory } from '../ThemeFactory'
import { ThemeSpec } from '../ThemeSpec'
import * as materialYouColorUtilities from '@material/material-color-utilities'
import { HoparaTheme } from './HoparaTheme'

export class HoparaThemeFactory implements ThemeFactory {
    getSpec(tenant: string, mode: string): ThemeSpec {
        const themeMode = mode || process.env.REACT_APP_MODE
        return ThemeSpec.fromBrand(HoparaTheme, materialYouColorUtilities as any, themeMode)
    }
}
