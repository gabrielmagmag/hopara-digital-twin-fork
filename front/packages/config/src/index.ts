 
export enum ConfigEnvironment {
  DEVELOPMENT = 'development',
  SYSTEM_TEST = 'systemTest',
  TEST = 'test',
  PRODUCTION = 'production',
  LOCAL = 'local',
}

type ConfigValue = string | (() => string) | any

type ConfigValues = {
  [ConfigEnvironment.DEVELOPMENT]: ConfigValue
  [ConfigEnvironment.SYSTEM_TEST]?: ConfigValue
  [ConfigEnvironment.TEST]?: ConfigValue
  [ConfigEnvironment.PRODUCTION]?: ConfigValue
  [ConfigEnvironment.LOCAL]?: ConfigValue
}

const HOPARA_ENV_KEY = 'HOPARA_ENV'

class ConfigMap extends Map<string, ConfigValues> {
  environment: ConfigEnvironment

  constructor(newMap: { [envName: string]: ConfigValues }) {
    super()

    Object.keys(newMap).forEach((configName) => {
      this.set(configName, newMap[configName])
    })

    this.setEnvFromFile()
    this.environment = this.getHoparaEnvironment()
  }

  private setEnvFromFile() {
    try {
      if ((window as any)?.__env__) {
        Object.keys((window as any).__env__).map((key) => {
          this.set(key, {development: (window as any).__env__[key]})
        })
      }
    } catch (_) {
      return _
    }
  }

  private getValueFromNodeEnvironment(key: string): string | undefined {
    return process.env[key] ?? process.env[`REACT_APP_${key}`]
  }

  private getHoparaEnvironment(): ConfigEnvironment {
    const env =
      this.getValueFromNodeEnvironment(HOPARA_ENV_KEY) ?? process.env.NODE_ENV
    if (!env) return ConfigEnvironment.DEVELOPMENT

    if (env === 'local') return ConfigEnvironment.LOCAL
    if (env === 'production') return ConfigEnvironment.PRODUCTION
    if (env === 'test') return ConfigEnvironment.TEST
    if (env === 'systemTest') return ConfigEnvironment.SYSTEM_TEST

    return ConfigEnvironment.DEVELOPMENT
  }

  isDevelopment(): boolean {
    return this.environment === ConfigEnvironment.DEVELOPMENT
  }

  setEnv(env: ConfigEnvironment) {
    this.environment = env
  }

  getValue(key: keyof typeof configMap, tenant?: string | null): string | any {
    if (key === HOPARA_ENV_KEY) return this.getHoparaEnvironment()

    const fromNodeEnv = this.getValueFromNodeEnvironment(key)
    if (fromNodeEnv) return fromNodeEnv

    const tenantKey = tenant ? `${tenant.toUpperCase()}_${key}` : key
    const configValues = this.get(tenantKey) ?? this.get(key)
    if (!configValues) return ''

    const value =
      configValues[this.environment] ??
      configValues[ConfigEnvironment.DEVELOPMENT]

    return typeof value === 'function' ? value() : value
  }

  getValueAsBoolean(
    key: keyof typeof configMap,
    tenant?: string | null
  ): boolean {
    return this.getValue(key, tenant) === 'true'
  }
}

const configMap = {
  [HOPARA_ENV_KEY]: {
    development: 'development',
    test: 'test',
    production: 'production',
    local: 'local',
  },
  BUILD_NUMBER: { development: '000' },
  PACKAGE_VERSION: { development: '0.0.0' },
  
  AUTH_ENABLED: {development: 'false', test: 'true', systemTest: 'true', production: 'true'},

  // CRA
  PUBLIC_URL: { development: '' },
  SYSTEM_TEST: { development: 'false', systemTest: 'true' },
  BASE_PATHNAME: { development: '', test: '', production: '', local: '' },
  BASE_URL: {
    development: 'http://localhost:3000',
    local: 'http://localhost:3000',
  },

  // API Endpoints
  VISUALIZATION_API_ADDRESS: {
    development: 'http://localhost:8081',
    systemTest: 'http://localhost:1234',
  },
  BFF_API_ADDRESS: {
    development: 'http://localhost:8086',
    systemTest: 'http://localhost:1234',
  },
  NOTIFICATION_API_ADDRESS: {
    development: 'http://localhost:8085',
    systemTest: 'http://localhost:1234',
  },
  DATASET_API_ADDRESS: {
    development: 'http://localhost:8000',
    systemTest: 'http://localhost:1234',
  },
  TEMPLATE_API_ADDRESS: {
    development: 'http://localhost:8089',
    systemTest: 'http://localhost:1234',
  },
  RESOURCE_API_ADDRESS: {
    development: 'http://localhost:2022',
  },
  AUTH_API_ADDRESS: {
    development: 'http://localhost:8088',
    systemTest: 'http://localhost:1234',
  },
  TENANT_API_ADDRESS: {
    development: 'http://localhost:2021',
    systemTest: 'http://localhost:1234',
  },
  // THEME
  HOPARA_THEME_MODE: { development: 'HOPARA' },
  STYLE_INTERFACE: { development: 'aphrodite' },

  // MAP
  ENABLE_MAP: { development: 'true', systemTest: 'false' },
  ARCGIS_API_TOKEN: {
    development:
      '',
  },
  MAPTILER_API_TOKEN: { development: 't0AYWwS0LsMuX1Of2myK&c=adasd' },
  GOOGLE_MAPS_API_KEY: {
    development: '',
  },

  // DATADOG
  DATADOG_RUM_APPLICATION_ID: {
    development: '',
  },
  DATADOG_RUM_CLIENT_TOKEN: {
    development: '',
  },
  DATADOG_RUM_SITE: { development: '' },

  CLOUD_FEATURES_ENABLED: { development: 'false', test: 'true', systemTest: 'true', production: 'true' },

  IS_EMBEDDED: { development: 'false' },
  IS_TOUCH_DEVICE: {
    development: () =>
      `${window?.matchMedia && window.matchMedia('(any-hover: none)').matches}`,
  },
  IS_HEADLESS_DEVICE: {
    development: () =>
      `${
        navigator.webdriver || /HeadlessChrome/.test(window.navigator.userAgent)
      }`,
    test: () => `false`,
    systemTest: () => `false`,
  },
  IS_SMALL_WIDTH_SCREEN: {
    development: () =>
      `${
        window?.matchMedia && window.matchMedia('(max-width: 767.5px)').matches
      }`,
  },
  IS_SMALL_HEIGHT_SCREEN: {
    development: () =>
      `${
        window?.matchMedia && window.matchMedia('(max-height: 520px)').matches
      }`,
  },
  TENANTS_WITHOUT_STORED_LOCATION: { development: ['ibbx.tech'] },
}

export const Config = new ConfigMap(configMap)
