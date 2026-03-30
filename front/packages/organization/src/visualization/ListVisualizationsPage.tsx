import React, { useContext, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Helmet } from 'react-helmet'

import { TemplateListContainer } from '../template/TemplateListContainer'
import { Sidebar } from '../sidebar/Sidebar'
import { VisualizationContext } from './service/VisualizationContext'
import { VisualizationList } from './VisualizationList'
import { DataSourceContext } from '../data-source/service/DataSourceContext'

import { SidebarLayout } from '@hopara/design-system/src/SidebarLayout'
import { ListCardsLayout } from '@hopara/design-system/src/ListCardsLayout'
import { BrowserWarningComponent } from '@hopara/design-system/src/warning/BrowserWarningComponent'
import { SpotlightContainer } from '@hopara/design-system/src/spotlight'
import { Title } from '@hopara/design-system/src/Title'

import { i18n } from '@hopara/i18n'
import { AuthContext } from '@hopara/auth-front/src/contexts/AuthContext'
import { BrowserContext } from '@hopara/browser'
import { Logger } from '@hopara/internals'
import { INTERNAL_DATA_SOURCE, SAMPLE_DATA_SOURCE } from '@hopara/dataset'
import { ListVisualizationsOnboarding } from './ListVisualizationsOnboarding'

import { TenantCreationStatus } from '../tenant/Tenant'
import { isPersonalSpace } from '@hopara/authorization/src/AuthRepository'

const SAMPLE_VISUALIZATIONS_COUNT = 8

const ListVisualizationsPage = () => {
  const authContext = useContext(AuthContext)
  const tenant = authContext.authorization.tenant
  const appContext = useContext(VisualizationContext)
  const dataSourceContext = useContext(DataSourceContext)
  const browserContext = useContext(BrowserContext)
  const dispatch = useDispatch()

  const [loading, setLoading] = React.useState(true)
  const [dataSourcesLoading, setDataSourcesLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [visualizations, setVisualizations] = React.useState<{ id: string; group: string }[]>([])
  const [hasDataSources, setHasDataSources] = React.useState<boolean>(false)
  const [poolingCount, setPoolingCount] = React.useState<number>(0)
  const [areSampleVisualizationsReady, setSampleVisualizationsReady] = React.useState<boolean | undefined>(undefined)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const visualizationPromise = appContext.appService.list(authContext.authorization)
      const dataSourcesPromise = dataSourceContext.dataSourceService.list(
        authContext.authorization,
        1000,
      )

      // We'll ignore for now
      dataSourcesPromise.catch(() => ({}))

      try {
        dispatch({ type: 'LIST_VISUALIZATION_PAGE_LOADED' })
        const payload = await visualizationPromise
        setVisualizations(payload)
      } catch (err: any) {
        if (err?.status === 401 && !authContext.authorization?.isDefault()) {
          return authContext.signOut()
        }
        Logger.error(err)
        setError(err?.message)
      }

      try {
        setDataSourcesLoading(true)
        const dataSources = await dataSourcesPromise
        setHasDataSources(
          dataSources.some((ds) => ![INTERNAL_DATA_SOURCE, SAMPLE_DATA_SOURCE].includes(ds.name)),
        )
      } catch {
        // We'll ignore for now
      }

      setLoading(false)
      setDataSourcesLoading(false)
    })()
  }, [])

  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    refreshTimerRef.current = setInterval(async () => {
      try {
        const payload = await appContext.appService.list(authContext.authorization)
        setVisualizations(payload)
      } catch (err: any) {
        if (err?.status === 401 && !authContext.authorization?.isDefault()) {
          return authContext.signOut()
        }
        Logger.error(err)
      }
    }, 5000)

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [])

  const sampleVisualizations = visualizations.filter(
    (visualization) => visualization.group?.toLowerCase() === 'sample'
  )
  const notSampleVisualizations = visualizations.filter(
    (visualization) => visualization.group?.toLowerCase() !== 'sample'
  )

  useEffect(() => {
    (async () => {
      const tenantPromise = dataSourceContext.tenantService.get(authContext.authorization.tenant, 
        authContext.authorization,
        1000)

      tenantPromise.catch(() => ({}))

      try {
        const tenant = await tenantPromise
        setSampleVisualizationsReady(tenant.creationStatus === TenantCreationStatus.READY)
      } catch {
        // we'll ignore for now
      }

      if ( !areSampleVisualizationsReady && sampleVisualizations.length < SAMPLE_VISUALIZATIONS_COUNT) {
        setTimeout(() => {
          setPoolingCount((prevCount) => prevCount + 1)
        }, 5000)
      }
    })()
  }, [poolingCount])

  const shouldShowOnboarding = !loading && !dataSourcesLoading && !notSampleVisualizations.length && authContext.authorization.canEditDataSources()
  const shouldShowYourVisualizationsTitle = (!loading && notSampleVisualizations.length) || shouldShowOnboarding
  const personalSpace = isPersonalSpace(
    authContext.authorization.email,
    authContext.authorization.tenant,
  )

  return (
    <SidebarLayout>
      <Helmet>
        <title>{i18n('VISUALIZATIONS')} - Hopara</title>
      </Helmet>
      
      <SpotlightContainer />
      <Sidebar />
      
      <ListCardsLayout>
        <BrowserWarningComponent
          inline
          isBrowserSupported={browserContext.platform.isSupported}
          isWebGLSupported={!!browserContext.webgl?.isSupported}
          isWebGLEnabled={!!browserContext.webgl?.isEnabled}
        />

        {authContext.authorization.canEditVisualization() && <TemplateListContainer />}
        
        {shouldShowYourVisualizationsTitle &&
          <Title>{i18n('YOUR_VISUALIZATIONS')}</Title>
        }

        {shouldShowOnboarding && 
          <ListVisualizationsOnboarding hasDataSources={hasDataSources} isPersonalSpace={personalSpace}/>
        }

        <VisualizationList
          error={error}
          isLoading={loading}
          sampleVisualizations={sampleVisualizations}
          notSampleVisualizations={notSampleVisualizations}
          areSampleVisualizationsReady={areSampleVisualizationsReady || 
                                        areSampleVisualizationsReady === undefined || 
                                        sampleVisualizations.length >= SAMPLE_VISUALIZATIONS_COUNT    }
          tenant={tenant}
          onDelete={async (visualizationId) => {
            setVisualizations(
              visualizations.filter((visualization) => visualization.id !== visualizationId),
            )
          }}
          onRename={async (visualizationId, newName) => {
            setVisualizations(
              visualizations.map((visualization) => {
                if (visualization.id === visualizationId) {
                  return { ...visualization, name: newName }
                }
                return visualization
              }),
            )
          }}
        />
      </ListCardsLayout>
    </SidebarLayout>
  )
}

export default ListVisualizationsPage
