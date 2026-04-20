import {Box, Button, InputAdornment} from '@mui/material'
import {styled, Theme} from '../theme'
import React from 'react'
import {Title} from '../Title'
import {i18n} from '@hopara/i18n'
import {SxProps} from '@mui/system'
import {TextField} from '../form'
import {MenuItemOrDivider, MoreButton} from '../buttons/MoreButton'
import {Icon} from '../icons/Icon'
import { PanelButton } from '../buttons/PanelButton'
import { Tooltip } from '../tooltip/Tooltip'

const BackButton = (props: { onBack; sx: SxProps<Theme> }) => (
  <PanelButton
    data-testid="back-button"
    onClick={props.onBack}
  >
    <Icon icon="arrow-left"/>
  </PanelButton>
)

const TitleBarDiv = styled(Box, {name: 'TitleBar'})(({theme}) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: '1em',
  placeItems: 'center',
  minHeight: 80,
  padding: '1em 1.5em 0.5em',
  marginBottom: '0.5em',
  position: 'sticky',
  top: 0,
  zIndex: 5,
  gridArea: 'title',
  width: '100%',
  backgroundColor: theme.palette.background.default,
  borderBottom: '1px solid',
  borderColor: theme.palette.spec.borderColor,
}))

const Actions = styled(Box, {name: 'TitleBarActions'})({
  placeItems: 'center',
  display: 'flex',
  flexDirection: 'row',
  gap: '0.5em',
  fontSize: 21,
})

export interface BarButton {
  testId: string;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
  responsiveIcon: React.ReactNode;
  tooltip?: string
  type?: 'button' | 'submit' | 'reset'
}

interface Props {
  sx?: SxProps<Theme>;
  children?: React.ReactNode;
  title: string | React.ReactNode;
  titleTestId?: string;
  onBack?: () => void;
  buttons?: BarButton[];
  hasSearch?: boolean;
  onSearchChange?: (value: string) => void;
  menuItems?: MenuItemOrDivider[];
}

export const TitleBar: React.FunctionComponent<Props> = (props) => {
  return (
    <TitleBarDiv>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: '0.5em',
        }}
      >
        {props.onBack && (
          <BackButton
            sx={{
              marginLeft: '-0.5em',
            }}
            onBack={props.onBack}
          />
        )}
        <Title data-testid={props.titleTestId ?? 'title'}>{props.title}</Title>
      </Box>
      <Actions>
        {props.hasSearch && (
          <TextField
            placeholder={i18n('SEARCH')}
            onChange={(event) =>
              props.onSearchChange && props.onSearchChange(event.target.value)
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="search"/>
                </InputAdornment>
              ),
            }}
          />
        )}
        {props.buttons?.map((button, index) => (
          <Box component={button.tooltip && !button.disabled ? Tooltip : undefined} key={index} title={button.tooltip}>
            <Button
              data-testid={button.testId}
              disabled={button.disabled}
              onClick={button.onClick}
              type={button.type}
              color={button.primary ? 'primary' : 'inherit'}
              variant={button.primary ? 'contained' : 'text'}
            >
              {button.label}
            </Button>
          </Box>
        ))}
        {props.menuItems && props.menuItems.length > 0 && <MoreButton menuItems={props.menuItems}/>}
      </Actions>
    </TitleBarDiv>
  )
}
