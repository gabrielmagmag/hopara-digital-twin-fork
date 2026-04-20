import React, { useContext, useEffect } from 'react'
import { i18n } from '@hopara/i18n'
import { DataSource, DataSourceType } from '../DataSource'
import { DataSourceContext } from '../service/DataSourceContext'
import { AuthContext } from '@hopara/auth-front/src/contexts/AuthContext'
import { ErrorPanel, SuccessPanel } from '@hopara/design-system/src/error/ErrorPanel'
import { useLocation, useMatch } from 'react-router-dom'
import { TextField } from '@hopara/design-system/src/form/TextField'
import { FieldSet } from '@hopara/design-system/src/form/FieldSet'
import { PageType } from '@hopara/page/src/Pages'
import { usePageNavigation } from '@hopara/page/src/PageNavigation'
import { LoadingSpinner } from '@hopara/design-system/src/loading-spinner/Spinner'
import { Sidebar } from '../../sidebar/Sidebar'
import { Helmet } from 'react-helmet'
import { TitleBar, BarButton } from '@hopara/design-system/src/title-bar/TitleBar'
import { Icon } from '@hopara/design-system/src/icons/Icon'
import { SidebarLayout } from '@hopara/design-system/src/SidebarLayout'
import { toastError, toastSuccess } from '@hopara/design-system/src/toast/Toast'
import { ModalDialog } from '@hopara/design-system/src/dialogs/ModalDialog'
import { Info } from '@hopara/design-system/src/empty/Info'

const FAKE_PASSWORD = '********'

interface ConnectionBasedProps {
  host: string
  setHost: (host: string) => void
  type: string
  savingOrTesting: boolean
  port: string
  setPort: (port: string) => void
  userName: string
  setUserName: (userName: string) => void
  password: string
  setPassword: (password: string) => void
  database: string
  setDatabase: (db: string) => void
  schema: string
  setSchema: (schema: string) => void
}

const ConnectionBasedComponent = (props: ConnectionBasedProps) => {
  return (
    <>
      <TextField
        testId="host"
        value={props.host}
        onSetValue={props.setHost}
        required={true}
        label={props.type !== DataSourceType.SNOWFLAKE ? i18n('HOST') : i18n('ACCOUNT_ID')}
        disabled={props.savingOrTesting}
        autoComplete='off'
        variant='outlined'
      />
      {props.type !== DataSourceType.SNOWFLAKE && <TextField
        testId="port"
        type="number"
        value={props.port}
        onSetValue={props.setPort}
        label={i18n('PORT')}
        disabled={props.savingOrTesting}
        autoComplete='off'
        variant='outlined'
      />}
      <TextField
        testId="userName"
        value={props.userName}
        onSetValue={props.setUserName}
        required={true}
        label={i18n('USER')}
        disabled={props.savingOrTesting}
        autoComplete='new-user'
        variant='outlined'
      />
      <TextField
        testId="password"
        type="password"
        value={props.password}
        onSetValue={props.setPassword}
        required={true}
        label={i18n('PASSWORD')}
        disabled={props.savingOrTesting}
        autoComplete='new-password'
        variant='outlined'
      />
      <TextField
        testId="database"
        value={props.database}
        onSetValue={props.setDatabase}
        required={true}
        label={i18n('DATABASE')}
        disabled={props.savingOrTesting}
        autoComplete="off"
        variant='outlined'
      />
      {props.type !== 'SINGLESTORE' && (
        <TextField
          testId="schema"
          value={props.schema}
          onSetValue={props.setSchema}
          label={i18n('SCHEMA')}
          disabled={props.savingOrTesting}
          autoComplete='off'
          variant='outlined'
        />)}
    </>
  )
}

function getLegend(type: DataSourceType) {
  if (type === DataSourceType.DUCKDB) {
    return i18n('FILE_DATA_SOURCE')
  }
  if (type === DataSourceType.JS_FUNCTION) {
    return i18n('JS_FUNCTION_DATA_SOURCE')
  }
  return i18n(type)
}

const EditDataSource = () => {
  const urlParams = useMatch({ path: '/:tenant/data-source/edit/:name/*' })
  const requestName = urlParams?.params.name ? decodeURI(urlParams.params.name) : undefined

  const dataSourceContext = useContext(DataSourceContext)
  const authContext = useContext(AuthContext)
  const pageNavigation = usePageNavigation(authContext.authorization.tenant)
  const [type, setType] = React.useState<DataSourceType>(DataSourceType.POSTGRES)
  const [host, setHost] = React.useState('')
  const [port, setPort] = React.useState('')
  const [userName, setUserName] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [database, setDatabase] = React.useState('')
  const [schema, setSchema] = React.useState('')
  const [name, setName] = React.useState('')
  const [showAdvancedOptions, setShowAdvancedOptions] = React.useState(false)
  const [maxConnections, setMaxConnections] = React.useState<string>('')
  const [quoteIdentifiers, setQuoteIdentifiers] = React.useState<boolean>(false)
  const [saving, setSaving] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState('')
  const [successMessage, setSuccessMessage] = React.useState('')
  const [testing, setTesting] = React.useState(false)
  const [dataSourceChangeWarningOpen, setDataSourceChangeWarningOpen] = React.useState(false)

  const isFileBased = type === DataSourceType.DUCKDB || type === DataSourceType.JS_FUNCTION

  let valid = !!(name?.length && host?.length && userName?.length && password?.length && database?.length)
  if (isFileBased) {
    valid = !!name?.length
  }

  const { search } = useLocation()

  useEffect(() => {
    const query = new URLSearchParams(search);

    (async () => {
      if (!requestName) {
        setLoading(false)
        setType((query.get('type') ?? DataSourceType.POSTGRES) as DataSourceType)
        return
      }
      setLoading(true)
      try {
        const ds = await dataSourceContext.dataSourceService.get(requestName, await authContext.getRefreshedAuthorization())
        const dataSource = new DataSource({ ...ds, password: FAKE_PASSWORD })
        setHost(dataSource.host)
        setPort(dataSource.port?.toString() ?? '')
        setUserName(dataSource.username)
        setPassword(FAKE_PASSWORD)
        setDatabase(dataSource.database)
        setSchema(dataSource.schema ?? '')
        setName(dataSource.name)
        setType(dataSource.type)
        setMaxConnections(
          dataSource.maxConnections !== undefined
            ? dataSource.maxConnections.toString()
            : ''
        )

        setQuoteIdentifiers(!!dataSource.quoteIdentifiers)
      } catch (err: any) {
        if (err.status === 404) {
          pageNavigation.navigate(PageType.NotFound)
        } else {
          toastError(err.message)
          pageNavigation.navigate(PageType.ListDataSources)
        }
      }
      setLoading(false)
    })()
  }, [search, pageNavigation, dataSourceContext, setLoading, authContext, requestName])

  const createDataSourceFromState = () => {
    return new DataSource({
      type,
      name,
      host: host && host.length > 0 ? host : undefined,
      port: port ? Number(port) : undefined,
      username: userName && userName.length > 0 ? userName : undefined,
      password: password === FAKE_PASSWORD ? undefined : password.length > 0 ? password : undefined,
      database: database && database.length > 0 ? database : undefined,
      schema: schema && schema.length > 0 ? schema : undefined,
      annotation: type === DataSourceType.JS_FUNCTION ? type : undefined,
      maxConnections: maxConnections ? Number(maxConnections) : undefined,
      quoteIdentifiers,
    })
  }

  const saveDataSource = async () => {
    try {
      const dataSource = createDataSourceFromState()
      await dataSourceContext.dataSourceService.upsert(dataSource, await authContext.getRefreshedAuthorization())
      toastSuccess(i18n('DATA_SOURCE_SAVED_SUCCESSFULLY'))
      pageNavigation.navigate(PageType.ViewDataSource, { name: dataSource.name })
    } catch (err: any) {
      setErrorMessage(err.message)
    }
    setSaving(false)
  }

  const saveButtonClicked = async () => {
    setErrorMessage('')
    setSuccessMessage('')
    setSaving(true)
    if (requestName) {
      setDataSourceChangeWarningOpen(true)
    } else {
      await saveDataSource()
    }
  }

  const testButtonClicked = async () => {
    setErrorMessage('')
    setSuccessMessage('')
    const dataSource = createDataSourceFromState()
    try {
      setTesting(true)
      await dataSourceContext.dataSourceService.test(dataSource, await authContext.getRefreshedAuthorization())
      toastSuccess(i18n('TEST_CONNECTION_SUCCESS'))
    } catch (err: any) {
      setErrorMessage(err.message)
    }
    setTesting(false)
  }

  const savingOrTesting = saving || testing

  const buttons: BarButton[] = [{
    testId: 'save-button',
    primary: true,
    disabled: saving || testing || !valid,
    onClick: saveButtonClicked,
    label: saving ? i18n('SAVING_ELLIPSIS') : i18n('SAVE'),
    responsiveIcon: <Icon icon="check" />,
    type: 'submit',
  }]

  if (!isFileBased) {
    buttons.push({
      testId: 'test-button',
      disabled: saving || testing || !valid,
      primary: false,
      onClick: testButtonClicked,
      label: i18n('TEST_CONNECTION'),
      responsiveIcon: <Icon icon="connection" />,
    })
  }

  return (
    <SidebarLayout>
      <Helmet>
        <title>{
          requestName ?
            pageNavigation.getTitle(PageType.EditDataSource) :
            pageNavigation.getTitle(PageType.CreateDataSource)
        }</title>
      </Helmet>
      <Sidebar />

      <div style={{
        gridArea: 'container',
      }}>
        {loading && <LoadingSpinner />}

        {!loading && <form noValidate onSubmit={async (event) => {
          event.preventDefault()
          await saveButtonClicked()
        }} autoComplete="off">
          <TitleBar
            title={requestName ? i18n('EDIT_DATA_SOURCE') : i18n('NEW_DATA_SOURCE')}
            titleTestId={requestName ? 'edit-title' : 'create-title'}
            onBack={() => pageNavigation.navigate(PageType.ListDataSources)}
            buttons={buttons}
          />
          <div style={{
            'display': 'grid',
            'gridAutoFlow': 'row',
            'maxWidth': '64ch',
            'margin': '4em auto 0',
            'gap': '1em',
          }}>
            <FieldSet legend={getLegend(type)}>
              <TextField
                testId="name"
                value={requestName ?? name}
                onSetValue={setName}
                disabled={savingOrTesting || !!requestName}
                autoComplete='off'
                required={true}
                label={i18n('NAME')}
                variant='outlined'
                autoFocus={!requestName && !name}
              />
              {!isFileBased && <ConnectionBasedComponent
                host={host}
                setHost={setHost}
                type={type}
                savingOrTesting={savingOrTesting}
                port={port}
                setPort={setPort}
                userName={userName}
                setUserName={setUserName}
                password={password}
                setPassword={setPassword}
                database={database}
                setDatabase={setDatabase}
                schema={schema}
                setSchema={setSchema}
              />}
              <span
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4em', gridColumn: '-1/1', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.08em', marginTop: 8 }}
              >
                {i18n('ADVANCED_OPTIONS')}
                <Icon icon={showAdvancedOptions ? 'chevron-close' : 'chevron-expand'} size={12} />
              </span>
              <div style={{
                gridColumn: '-1/1',
                display: 'grid',
                gridTemplateColumns: 'subgrid',
                gap: 16,
                ...(!showAdvancedOptions ? { maxHeight: 0, overflow: 'hidden' } : {}),
              }}>
                <TextField
                  testId="maxConnections"
                  type="number"
                  value={maxConnections}
                  onSetValue={setMaxConnections}
                  label={i18n('MAX_CONNECTIONS')}
                  disabled={savingOrTesting}
                  autoComplete="off"
                  variant="outlined"
                />

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5em', gridColumn: '-1/1' }}>
                  <input
                    type="checkbox"
                    checked={quoteIdentifiers}
                    onChange={(e) => setQuoteIdentifiers(e.target.checked)}
                    disabled={savingOrTesting}
                    style={{ accentColor: 'var(--md-sys-color-primary)' }}
                  />
                  {i18n('QUOTE_IDENTIFIERS')}
                </label>
              </div>
            </FieldSet>

            <ErrorPanel error={errorMessage} />
            <SuccessPanel message={successMessage} />

            {type === DataSourceType.DUCKDB && <Info description={<>
              {i18n('YOU_CAN_THINK_OF_A_FILE_DATA_SOURCE_AS_A_FOLDER_WHERE_YOU_CAN_UPLOAD_FILES_AND_ADD_QUERIES')}
            </>} />}

            {type === DataSourceType.JS_FUNCTION && <Info description={<>
              {i18n('JS_FUNCTION_INFO_DESCRIPTION')}
            </>} />}
          </div>
        </form>}
      </div>

      <ModalDialog
        title={i18n('DATASOURCE_CHANGE')}
        description={i18n('DATASOURCE_CHANGE_MESSAGE')}
        open={dataSourceChangeWarningOpen}
        onConfirm={async () => {
          setDataSourceChangeWarningOpen(false)
          await saveDataSource()
        }}
        onCancel={() => {
          setSaving(false)
          setDataSourceChangeWarningOpen(false)
        }}
      />

    </SidebarLayout>
  )
}

export default EditDataSource
